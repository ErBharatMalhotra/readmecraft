import { describe, expect, it } from 'vitest';
import { analyzeArchitecture } from '@/lib/architecture';

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
