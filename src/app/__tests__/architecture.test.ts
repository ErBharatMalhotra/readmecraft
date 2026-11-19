import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  analyzeArchitecture,
  clearArchitectureCache,
  fetchArchitectureModel,
} from '@/lib/architecture';

describe('architecture static analysis', () => {
  it('classifies node dependencies into layers', () => {
    const model = analyzeArchitecture({
      owner: 'octocat',
      repo: 'readmecraft',
      packageJson: {
        dependencies: { next: '16.0.0', react: '19.0.0', '@prisma/client': '6.0.0' },
        devDependencies: { typescript: '5.0.0', vitest: '3.0.0' },
      },
      directories: ['src', 'prisma', 'public'],
    });

    expect(model.layers.client).toContain('Next.js');
    expect(model.layers.data).toContain('Prisma');
    expect(model.layers.tooling).toContain('TypeScript');
    expect(model.layers.tooling).toContain('Vitest');
    // folders only add what dependencies did not already cover
    expect(model.layers.data).toContain('prisma/');
    expect(model.sources).toContain('package.json');
    expect(model.degraded).toBe(false);
  });

  it('deduplicates technologies that ship under several packages', () => {
    const model = analyzeArchitecture({
      owner: 'o',
      repo: 'r',
      packageJson: { dependencies: { react: '19', 'react-dom': '19' } },
    });
    const reactCount = model.layers.client.filter((item) => item === 'React').length;
    expect(reactCount).toBe(1);
  });

  it('reads python manifests by presence of known packages', () => {
    const model = analyzeArchitecture({
      owner: 'o',
      repo: 'r',
      files: [
        { name: 'requirements.txt', content: 'fastapi==0.110.0\nsqlalchemy>=2.0\nuvicorn\n' },
      ],
    });
    expect(model.layers.api).toContain('FastAPI');
    expect(model.layers.data).toContain('SQLAlchemy');
    expect(model.manifests).toContain('requirements.txt');
  });

  it('does not invent technologies from substrings in manifest text', () => {
    const model = analyzeArchitecture({
      owner: 'o',
      repo: 'r',
      files: [
        {
          name: 'requirements.txt',
          content: '# logging utilities\nlogging==0.4.9\nexposure>=1.0\n',
        },
        { name: 'Cargo.toml', content: '[profile.release]\nlto = true\n' },
      ],
    });
    expect(model.layers.api).not.toContain('Gin');
    expect(model.layers.client).not.toContain('Expo');
  });

  it('falls back to folder names when no manifest exists', () => {
    const model = analyzeArchitecture({
      owner: 'o',
      repo: 'r',
      directories: ['components', 'api', 'db', 'scripts'],
    });
    expect(model.layers.client).toContain('components/');
    expect(model.layers.api).toContain('api/');
    expect(model.layers.data).toContain('db/');
    expect(model.degraded).toBe(true);
  });

  it('caps each layer at four entries so the diagram stays readable', () => {
    const model = analyzeArchitecture({
      owner: 'o',
      repo: 'r',
      directories: [
        'components',
        'pages',
        'styles',
        'ui',
        'public',
        'app',
        'apps',
        'api',
        'server',
        'routes',
      ],
    });
    expect(model.layers.client.length).toBeLessThanOrEqual(4);
    expect(model.layers.api.length).toBeLessThanOrEqual(4);
  });

  it('says so when nothing could be classified', () => {
    const model = analyzeArchitecture({ owner: 'o', repo: 'r' });
    expect(model.degraded).toBe(true);
    expect(model.sources).toEqual([]);
  });
});

describe('architecture fetching budget', () => {
  const calls: string[] = [];

  const respond = (body: unknown, ok = true, status = 200) =>
    ({
      ok,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    }) as unknown as Response;

  const file = (name: string, repo = 'r', branch = 'master') => ({
    name,
    type: 'file',
    download_url: `https://raw.githubusercontent.com/o/${repo}/${branch}/${name}`,
  });
  const dir = (name: string) => ({ name, type: 'dir', download_url: null });

  beforeEach(() => {
    calls.length = 0;
    clearArchitectureCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('spends two GitHub calls on a node repo and skips other manifests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: unknown) => {
        const url = String(input);
        calls.push(url);
        if (url.endsWith('/contents/')) {
          return respond([
            file('package.json'),
            dir('src'),
            dir('prisma'),
            file('requirements.txt'),
          ]);
        }
        if (url.endsWith('/HEAD/package.json')) {
          return respond(JSON.stringify({ dependencies: { next: '16', '@prisma/client': '6' } }));
        }
        return respond('', false, 404);
      })
    );

    const model = await fetchArchitectureModel('o', 'r');

    expect(calls).toHaveLength(2);
    expect(calls.some((url) => url.includes('requirements.txt'))).toBe(false);
    expect(calls.some((url) => /\/repos\/o\/r$/.test(url))).toBe(false);
    expect(model.layers.client).toContain('Next.js');
    expect(model.layers.data).toContain('Prisma');
    // Branch comes from the listing download_url, so no /repos call was needed.
    expect(model.defaultBranch).toBe('master');
  });

  it('falls back only to manifests the listing proved exist', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: unknown) => {
        const url = String(input);
        calls.push(url);
        if (url.endsWith('/contents/')) {
          return respond([file('requirements.txt', 'r', 'main'), dir('api')]);
        }
        if (url.endsWith('/HEAD/package.json')) return respond('', false, 404);
        if (url.endsWith('/main/requirements.txt'))
          return respond('fastapi==0.110.0\nsqlalchemy>=2.0\n');
        return respond('', false, 404);
      })
    );

    const model = await fetchArchitectureModel('o', 'r');

    // contents + package.json probe + the one manifest that exists
    expect(calls).toHaveLength(3);
    expect(calls.some((url) => url.includes('go.mod'))).toBe(false);
    expect(model.layers.api).toContain('FastAPI');
    expect(model.layers.data).toContain('SQLAlchemy');
  });

  it('shares one cold fetch between concurrent requests and then serves cache', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: unknown) => {
        const url = String(input);
        calls.push(url);
        if (url.endsWith('/contents/')) return respond([file('package.json')]);
        if (url.endsWith('/HEAD/package.json')) {
          return respond(JSON.stringify({ dependencies: { react: '19' } }));
        }
        return respond('', false, 404);
      })
    );

    const [a, b] = await Promise.all([
      fetchArchitectureModel('o', 'r'),
      fetchArchitectureModel('o', 'r'),
    ]);
    expect(a.layers.client).toContain('React');
    expect(b.layers.client).toContain('React');
    expect(calls).toHaveLength(2);

    await fetchArchitectureModel('o', 'r');
    expect(calls).toHaveLength(2);
  });

  it('caches an empty result only briefly, so a transient failure can recover', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    vi.stubGlobal(
      'fetch',
      vi.fn((input: unknown) => {
        calls.push(String(input));
        return respond('', false, 404);
      })
    );

    const first = await fetchArchitectureModel('o', 'empty');
    expect(first.degraded).toBe(true);
    expect(calls).toHaveLength(2);

    await fetchArchitectureModel('o', 'empty');
    expect(calls).toHaveLength(2);

    vi.setSystemTime(new Date('2026-01-01T00:03:00Z'));
    await fetchArchitectureModel('o', 'empty');
    expect(calls).toHaveLength(4);
  });
});
