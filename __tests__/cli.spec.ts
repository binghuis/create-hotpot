import FileJson from '@srzorro/file-json';
import type { ExecaSyncReturnValue, SyncOptions } from 'execa';
import { execaCommandSync } from 'execa';
import fs from 'fs-extra';
import gitly from 'gitly';
import { join } from 'node:path';
import path from 'node:path';
import { PackageJson } from 'type-fest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

const CLI_PATH = join(__dirname, '..');

const projectName = 'test-app';
const genPath = join(__dirname, projectName);
const templatePath = join(__dirname, 'template');
const template = 'react-desktop';

const run = (
  args: string[],
  options: SyncOptions = {},
): ExecaSyncReturnValue => {
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

const createNonEmptyDir = () => {
  fs.mkdirpSync(genPath);
  const pkgJson = join(genPath, 'package.json');
  fs.writeFileSync(pkgJson, '{ "foo": "bar" }');
};

describe('测试生成结果', async () => {
  await gitly('binghuis/template-react-desktop', templatePath, {});
  const pkg = new FileJson<PackageJson>(
    path.join(templatePath, 'package.json'),
  );
  await pkg.r();
  pkg.d.name = projectName;
  await pkg.w();

  const templateFiles = fs.readdirSync(templatePath).sort();

  test('测试 --template 结果', async () => {
    const { stdout } = run([projectName, '--template', template], {
      cwd: __dirname,
    });

    const generatedFiles = fs.readdirSync(genPath).sort();
    expect(stdout).toContain("cd test-app");
    expect(templateFiles).toEqual(generatedFiles);
  });

  test('测试 -t 结果', () => {
    const { stdout } = run([projectName, '-t', template], {
      cwd: __dirname,
    });

    const generatedFiles = fs.readdirSync(genPath).sort();
    expect(stdout).toContain("cd test-app");
    expect(templateFiles).toEqual(generatedFiles);
  });
});

test('直接执行CLI命令，不传参', () => {
  const { stdout } = run([]);
  expect(stdout).toContain('项目名:');
});

test('仅传项目构建目录', () => {
  fs.mkdirpSync(genPath);
  const { stdout } = run(['.'], { cwd: genPath });
  expect(stdout).toContain('请选择一个项目模板:');
});

test('仅传项目名', () => {
  const { stdout } = run([projectName]);
  expect(stdout).toContain('请选择一个项目模板:');
});

test('传项目名和 --template 参数', () => {
  const { stdout } = run([projectName, '--template']);
  expect(stdout).toContain('请选择一个项目模板:');
});

test('传项目名和一个无效的 --template', () => {
  const { stdout } = run([projectName, '--template', 'unknown']);
  expect(stdout).toContain(`模板 "unknown" 不存在。请从下面模板中选择:`);
});

test('目标目录非空', () => {
  createNonEmptyDir();
  const { stdout } = run([projectName], { cwd: __dirname });
  expect(stdout).toContain(
    `目标目录 "${projectName}" 已存在文件。是否清空并继续创建？`,
  );
});

test('目标（当前）目录非空', () => {
  createNonEmptyDir();
  const { stdout } = run(['.'], { cwd: genPath });
  expect(stdout).toContain("当前目录已存在文件。是否清空并继续创建？");
});
