import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Octokit } from '@octokit/rest';

// ============================================================================
// Write-back: preview and open a README pull request in the user's repo
// ============================================================================
// Uses the OAuth access token stored in the signed session cookie, so nothing
// is written until the user has seen the diff and pressed the button. Pull
// requests are the default path; a direct commit is still available for the
// profile-repo case (`username/username`) where a PR adds no value.

export const runtime = 'nodejs';

const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const README_PATH = 'README.md';
const MAX_MARKDOWN_BYTES = 300_000;

interface WritebackSession {
  token: string;
  login: string;
}

async function readSession(): Promise<WritebackSession | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const store = await cookies();
  const raw = store.get('nextauth.session-token')?.value;
  if (!raw) return null;

  try {
    const { payload } = await jwtVerify(raw, new TextEncoder().encode(secret));
    const session = payload as { accessToken?: string; user?: { login?: string } };
    if (!session.accessToken || !session.user?.login) return null;
    return { token: session.accessToken, login: session.user.login };
  } catch {
    return null;
  }
}

function parseRepo(value: unknown): { owner: string; name: string; full: string } | null {
  if (typeof value !== 'string') return null;
  const repo = value.trim();
  if (!REPO_PATTERN.test(repo)) return null;
  const [owner, name] = repo.split('/');
  return { owner, name, full: `${owner}/${name}` };
}

async function readReadme(octokit: Octokit, owner: string, repo: string, ref?: string) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: README_PATH,
      ...(ref ? { ref } : {}),
    });
    if (Array.isArray(data) || data.type !== 'file') return null;
    return {
      content: Buffer.from(data.content, 'base64').toString('utf8'),
      sha: data.sha,
    };
  } catch (error: any) {
    if (error?.status === 404) return null;
    throw error;
  }
}

function failure(error: any) {
  const status = typeof error?.status === 'number' ? error.status : 500;
  const message = typeof error?.message === 'string' ? error.message : 'GitHub request failed.';
  console.error('[writeback]', status, message);

  let friendly = message;
  if (status === 401) {
    friendly = 'GitHub rejected the session token. Sign in again to refresh access.';
  } else if (status === 403) {
    friendly =
      'GitHub denied write access. Check that your token has the "repo" scope and that you can push to this repository.';
  } else if (status === 404) {
    friendly = 'Repository or README not found, or your account has no access to it.';
  }

  return NextResponse.json(
    { error: friendly },
    { status: status >= 400 && status < 600 ? status : 500 }
  );
}

export async function GET(req: NextRequest) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Sign in with GitHub to preview a write-back.' },
      { status: 401 }
    );
  }

  const target = parseRepo(req.nextUrl.searchParams.get('repo'));
  if (!target) {
    return NextResponse.json(
      { error: 'Use the owner/repo format, for example yourname/yourname.' },
      { status: 400 }
    );
  }

  const octokit = new Octokit({ auth: session.token });
  try {
    const { data: repo } = await octokit.rest.repos.get({
      owner: target.owner,
      repo: target.name,
    });
    const existing = await readReadme(octokit, target.owner, target.name, repo.default_branch);

    return NextResponse.json(
      {
        repo: target.full,
        login: session.login,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        path: README_PATH,
        exists: Boolean(existing),
        content: existing?.content ?? '',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return failure(error);
  }
}

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in with GitHub to write a README.' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const target = parseRepo(body?.repo);
  if (!target) {
    return NextResponse.json(
      { error: 'Use the owner/repo format, for example yourname/yourname.' },
      { status: 400 }
    );
  }

  const markdown = typeof body?.markdown === 'string' ? body.markdown : '';
  if (!markdown.trim()) {
    return NextResponse.json({ error: 'The generated README is empty.' }, { status: 400 });
  }
  if (Buffer.byteLength(markdown, 'utf8') > MAX_MARKDOWN_BYTES) {
    return NextResponse.json(
      { error: 'README is larger than 300 KB; trim it before writing.' },
      { status: 413 }
    );
  }

  const mode: 'pr' | 'direct' = body?.mode === 'direct' ? 'direct' : 'pr';
  const octokit = new Octokit({ auth: session.token });
  const commitMessage = 'docs: refresh README via ReadmeCraft';

  try {
    const { data: repo } = await octokit.rest.repos.get({
      owner: target.owner,
      repo: target.name,
    });
    const baseBranch = repo.default_branch;
    const existing = await readReadme(octokit, target.owner, target.name, baseBranch);

    if (existing && existing.content === markdown) {
      return NextResponse.json(
        { unchanged: true, repo: target.full, branch: baseBranch },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const author = {
      name: session.login,
      email: `${session.login}@users.noreply.github.com`,
    };

    if (mode === 'direct') {
      const { data: written } = await octokit.rest.repos.createOrUpdateFileContents({
        owner: target.owner,
        repo: target.name,
        path: README_PATH,
        message: commitMessage,
        content: Buffer.from(markdown).toString('base64'),
        branch: baseBranch,
        sha: existing?.sha,
        author,
        committer: author,
      });

      return NextResponse.json(
        {
          mode,
          repo: target.full,
          branch: baseBranch,
          commitUrl: written.commit.html_url,
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const { data: baseRef } = await octokit.rest.git.getRef({
      owner: target.owner,
      repo: target.name,
      ref: `heads/${baseBranch}`,
    });

    const branch = `readmecraft/readme-${Date.now().toString(36)}`;

    await octokit.rest.git.createRef({
      owner: target.owner,
      repo: target.name,
      ref: `refs/heads/${branch}`,
      sha: baseRef.object.sha,
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: target.owner,
      repo: target.name,
      path: README_PATH,
      message: commitMessage,
      content: Buffer.from(markdown).toString('base64'),
      branch,
      sha: existing?.sha,
      author,
      committer: author,
    });

    const { data: pull } = await octokit.rest.pulls.create({
      owner: target.owner,
      repo: target.name,
      title: commitMessage,
      head: branch,
      base: baseBranch,
      body: [
        'Generated with [ReadmeCraft](https://readme.bharatdn.com).',
        '',
        'This PR only replaces `README.md`. Review the diff and merge when it looks right;',
        'closing the PR leaves your current README untouched.',
      ].join('\n'),
    });

    return NextResponse.json(
      { mode, repo: target.full, branch, baseBranch, prUrl: pull.html_url },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return failure(error);
  }
}
