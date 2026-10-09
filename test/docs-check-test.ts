import * as chai from 'chai';
import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const { expect } = chai;
const ROOT = path.join(__dirname, '..');

// Only disposable fixtures are modified; no test stages or regenerates the real README.
describe('the docs check and commit gate', function docsChecks() {
  this.timeout(30000);
  let fixture: string;

  beforeEach(() => {
    fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'ip-address-docs-'));
    ['src', 'scripts', 'README.md', 'tsconfig.json', 'package.json', 'hooks'].forEach((name) => {
      fs.cpSync(path.join(ROOT, name), path.join(fixture, name), { recursive: true });
    });
    fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(fixture, 'node_modules'));
  });

  afterEach(() => {
    fs.rmSync(fixture, { recursive: true });
  });

  function docs(check: boolean) {
    return childProcess.spawnSync(
      path.join(ROOT, 'node_modules/.bin/tsx'),
      ['scripts/build-readme.ts', ...(check ? ['--check'] : [])],
      { cwd: fixture, encoding: 'utf8' },
    );
  }

  it('rejects stale docs without rewriting them and accepts regenerated docs', () => {
    const readme = path.join(fixture, 'README.md');
    fs.appendFileSync(readme, '\nStale fixture\n');
    const before = fs.readFileSync(readme, 'utf8');
    expect(docs(true).status).to.equal(1);
    expect(fs.readFileSync(readme, 'utf8')).to.equal(before);
    expect(docs(false).status).to.equal(0);
    const generated = fs.readFileSync(readme, 'utf8');
    expect(docs(true).status).to.equal(0);
    expect(fs.readFileSync(readme, 'utf8')).to.equal(generated);
  });

  it('runs the docs gate and refuses partially staged inputs without changing the index', () => {
    function git(args: string[]) {
      return childProcess.execFileSync('git', args, { cwd: fixture, encoding: 'utf8' });
    }
    git(['init', '-q']);
    git(['add', 'src', 'scripts', 'README.md', 'tsconfig.json', 'package.json']);
    const bin = path.join(fixture, 'bin');
    fs.mkdirSync(bin);
    fs.writeFileSync(
      path.join(bin, 'npm'),
      '#!/bin/sh\nprintf "%s\\n" "$*" >> "$CALLS"\ncase "$*" in *docs:check*) exit 1;; esac\n',
      { mode: 0o755 },
    );
    const calls = path.join(fixture, 'calls');
    const runHook = () =>
      childProcess.spawnSync('sh', ['hooks/pre-commit'], {
        cwd: fixture,
        encoding: 'utf8',
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CALLS: calls },
      });
    expect(runHook().status).to.equal(1);
    expect(fs.readFileSync(calls, 'utf8')).to.include('docs:check');
    const index = git(['write-tree']);
    fs.appendFileSync(path.join(fixture, 'README.md'), '\nUnstaged edit\n');
    const result = runHook();
    expect(result.status).to.equal(1);
    expect(result.stdout + result.stderr).to.include('unstaged');
    expect(git(['write-tree'])).to.equal(index);
    expect(fs.readFileSync(path.join(fixture, 'README.md'), 'utf8')).to.include('Unstaged edit');
  });
});
