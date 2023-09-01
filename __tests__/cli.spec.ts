import { join } from 'node:path';
import path from 'node:path';
import FileJson from '@srzorro/file-json';
import type { ExecaSyncReturnValue, SyncOptions } from 'execa';
import { execaCommandSync } from 'execa';
import fs from 'fs-extra';
import gitly from 'gitly';
import { PackageJson } from 'type-fest';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

const CLI_PATH = join(__dirname, '../dist/index.js');

const projectName = 'test-app';
const genPath = join(__dirname, projectName);
const templatePath = join(__dirname, 'template');
const template = 'react-admin';

const run = (args: string[], options: SyncOptions = {}): ExecaSyncReturnValue => {
  return execaCommandSync(`node ${CLI_PATH} ${args.join(' ')}`, options);
};

beforeEach(() => {
  fs.removeSync(genPath);
});

beforeAll(() => {
  fs.removeSync(templatePath);
});

afterAll(() => {
  fs.removeSync(genPath);
  fs.removeSync(templatePath);
});

describe('测试生成结果', async () => {
  await gitly('binghuis/template-react-desktop', templatePath, {});
  const pkg = new FileJson<PackageJson>(path.join(templatePath, 'package.json'));
  await pkg.r();
  pkg.d.name = projectName;
  await pkg.w();

  const templateFiles = fs.readdirSync(templatePath).sort();

  test('测试 -t 结果', () => {
    const { stdout } = run([projectName, '-t', template], {
      cwd: __dirname,
    });

    const generatedFiles = fs.readdirSync(genPath).sort();
    expect(stdout).toContain('cd test-app');
    expect(templateFiles).toEqual(generatedFiles);
  });
});
