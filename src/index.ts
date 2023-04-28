import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cyan, green, yellow } from 'kolorist';

import minimist from 'minimist';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { FRAMEWORKS } from './constant';
import { Framework } from './types';
import gitly from 'gitly';

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
          message: chalk.reset('项目名:'),
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
              throw new Error(chalk.red('✖') + ' 操作已取消');
            }
            return null;
          },
          name: 'overwriteChecker',
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
          name: 'packageName',
          message: chalk.reset('输入 package.json 名:'),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) =>
            isValidPackageName(dir) || '无效的 package.json 名，请重新输入',
        },
        {
          type:
            argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
          name: 'framework',
          message:
            typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate)
              ? chalk.reset(`模板 "${argTemplate}" 不存在。请从下面模板中选择:`)
              : chalk.reset('请选择一个模板构建项目:'),
          initial: 0,
          choices: FRAMEWORKS.map((framework) => {
            const frameworkColor = framework.color;
            return {
              title: frameworkColor(framework.display || framework.name),
              value: framework,
            };
          }),
        },
        {
          type: (framework: Framework) =>
            framework && framework.variants ? 'select' : null,
          name: 'variant',
          message: chalk.reset('请选择一个模板变体:'),
          choices: (framework: Framework) =>
            framework.variants.map((variant) => {
              const variantColor = variant.color;
              return {
                title: variantColor(variant.display || variant.name),
                value: variant.name,
              };
            }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(chalk.red('✖') + ' 操作已取消');
        },
      },
    );
  } catch (cancelled: any) {
    console.log(cancelled.message);
    return;
  }

  const { framework, overwrite, packageName, variant } = result;

  const root = path.join(cwd, targetDir);

  if (overwrite) {
    emptyDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  const template: string = variant || framework?.name || argTemplate;

  spinner.start('休息，休息一下🍵，模板代码正在下载✨');

  await gitly('binghuis/template-react-desktop', path.join(cwd, 'test'), {});

  const cdProjectName = path.relative(cwd, root);

  spinner.succeed('搭建成功，请继续输入:');

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

/** 去掉两端空格，并替换掉字符串末尾的一个或多个斜杠（/），以确保目标目录的格式正确 */
function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, '');
}

/** 验证用户输入的项目名称是否符合命名规范 */
function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  );
}

/** 将用户输入的项目名称转换为一个符合命名规范的字符串 */
function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // 匹配所有空格，并用连字符 - 替换
    .replace(/^[._]/, '') // 匹配开头的点号或下划线，将其删除
    .replace(/[^a-z\d\-~]+/g, '-'); // 匹配所有非小写字母、数字、连字符、波浪线的字符，并用连字符 - 替换
}



/** 判断项目目录是否为空 */
function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

/** 清空指定目录下的所有文件和子目录 */
function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue;
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

init().catch((e) => {
  console.error(e);
});
