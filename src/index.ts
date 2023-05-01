import fs from 'node:fs';
import path from 'node:path';
import { reset, red, yellow } from 'kolorist';
import minimist from 'minimist';
import prompts from 'prompts';
import ora from 'ora';
import gitly from 'gitly';
import FileJson from '@srzorro/file-json';
import { FRAMEWORKS } from './constant';
import type { PackageJson } from 'type-fest';
import { Framework } from './type';
import {
  cleanDir,
  findRepoByName,
  formatTargetDir,
  isEmpty,
  isValidPackageName,
  toValidPackageName,
} from './tool';

const argv = minimist<{
  t?: string;
  template?: string;
}>(process.argv.slice(2), { string: ['_'] });

const cwd = process.cwd();

const TEMPLATES = FRAMEWORKS.map(
  (f) => (f.variants && f.variants.map((v) => v.name)) || [f.name],
).reduce((a, b) => a.concat(b), []);

const defaultTargetDir = 'my-hotpot';

async function init() {
  const spinner = ora();

  const argTargetDir = formatTargetDir(argv._[0]);

  const argTemplate = argv.template || argv.t;

  let targetDir = argTargetDir || defaultTargetDir;

  const getProjectName = () =>
    targetDir === '.' ? path.basename(path.resolve()) : targetDir;

  let result: prompts.Answers<
    'projectName' | 'overwrite' | 'packageName' | 'framework' | 'variant'
  >;

  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : 'text',
          name: 'projectName',
          message: reset('项目名:'),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir;
          },
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: () =>
            (targetDir === '.' ? '当前目录' : `目标目录 "${targetDir}"`) +
            ` 已存在文件。是否清空并继续创建？`,
        },
        {
          type: (_, { overwrite }: { overwrite?: boolean }) => {
            if (overwrite === false) {
              throw new Error(red('✖') + ' 操作已取消');
            }
            return null;
          },
          name: 'overwriteChecker',
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
          name: 'packageName',
          message: reset('输入 Package Name:'),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) =>
            isValidPackageName(dir) || '无效的 Package Name，请重新输入',
        },
        {
          type:
            argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
          name: 'framework',
          message:
            typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate)
              ? reset(`模板 "${argTemplate}" 不存在。请从下面模板中选择:`)
              : reset('请选择一个项目模板:'),
          initial: 0,
          choices: FRAMEWORKS.map((framework) => {
            const { color, display, name } = framework;
            return {
              title: color(display || name),
              value: framework,
            };
          }),
        },
        {
          type: (framework: Framework) =>
            framework && framework.variants ? 'select' : null,
          name: 'variant',
          message: reset('请选择一个模板变体:'),
          choices: (framework: Framework) =>
            framework.variants.map(({ color, display, name }) => {
              return {
                title: color(display || name),
                value: name,
              };
            }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' 操作已取消');
        },
      },
    );
  } catch (cancelled: any) {
    console.log(cancelled.message);
    return;
  }

  const { framework, overwrite, packageName, variant } = result;

  const root = path.join(cwd, targetDir);

  const template: string = variant || framework?.name || argTemplate;

  const repo = findRepoByName(template, FRAMEWORKS);

  if (!repo) {
    console.log(`  ${yellow('当前模板暂未发布 🐶')}`);
    return;
  }

  if (overwrite) {
    cleanDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  spinner.start('休息一下，模板正在生成 🐢');

  await gitly(repo, root, {});

  const pkgName = packageName ?? getProjectName();

  if (pkgName) {
    const pkg = new FileJson<PackageJson>(path.join(root, 'package.json'));
    await pkg.r();
    pkg.d.name = pkgName;
    await pkg.w();
  }

  spinner.succeed('搭建成功，请继续:');

  const cdProjectName = path.relative(cwd, root);

  if (root !== cwd) {
    console.log(
      `  cd ${
        cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
      }`,
    );
  }

  console.log(`  pnpm i`);
  console.log(`  pnpm dev`);
}

init().catch((e) => {
  console.error(e);
});
