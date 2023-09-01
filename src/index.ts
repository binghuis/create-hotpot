#! /usr/bin/env node

import path from 'node:path';
import * as p from '@clack/prompts';
import FileJson from '@srzorro/file-json';
import { cli } from 'cleye';
import { consola } from 'consola';
import fs from 'fs-extra';
import gitly from 'gitly';
import kleur from 'kleur';
import { PackageJson } from 'type-fest';
import pkg from '../package.json';
import { FRAMEWORKS, FRAMEWORK_TEMPLATE, TEMPLATES, TEMPLATE_NAMES } from './template';
import { areDirectoriesEqual, cleanDir, isEmptyDir, isPathValid } from './tool';
import { ValidFramework, ValidFrameworkVariant } from './type';

const argv = cli({
  name: pkg.name,
  version: pkg.version,
  parameters: ['[target dir]'],
  flags: {
    template: {
      type: String,
      description: '要加载的模板名称',
      alias: 't',
    },
  },
  help: {
    description: pkg.homepage,
    usage: ['pnpm create hotpot', 'pnpm create hotpot [target dir] -t [template name]'],
  },
});

const {
  flags: { template: argTemplateName },
  _: { targetDir: argTargetDir },
} = argv;

const cancel = (message?: string) => {
  p.cancel(message ?? '✖ 已取消');
  process.exit(0);
};

const defaultTargetDir = 'my-hotpot';

const init = async () => {
  let targetDir = argTargetDir ?? '';
  if (!targetDir) {
    targetDir = (await p.text({
      message: '项目名:',
      placeholder: defaultTargetDir,
      defaultValue: defaultTargetDir,
      validate(value) {
        if (!isPathValid(value ? value : defaultTargetDir)) {
          return '包含非法字符';
        }
      },
    })) as string;
  }

  const cwd = process.cwd();
  const absTargetDir = path.resolve(cwd, targetDir);
  const relativeTargetDir = path.relative(cwd, absTargetDir);

  const pkgName = path.basename(absTargetDir);

  if (!fs.existsSync(absTargetDir)) {
    fs.mkdirSync(absTargetDir, { recursive: true });
  }

  if (!isEmptyDir(absTargetDir)) {
    const overwrite = (await p.confirm({
      message: `${
        areDirectoriesEqual(cwd, absTargetDir) ? '当前目录' : `目标目录 "${targetDir}" `
      }已存在文件。是否清空并继续创建？`,
    })) as boolean;

    if (!overwrite) {
      cancel();
    }
  }

  let tempalteName = argTemplateName ?? '';
  if (!TEMPLATE_NAMES.includes(tempalteName)) {
    const t = await p.group<{
      frameworkName: ValidFramework['value'] | symbol;
      promptTempalteName: ValidFrameworkVariant['value'] | symbol;
    }>(
      {
        frameworkName: () =>
          p.select({
            message: tempalteName ? `模板 "${tempalteName}" 不存在。请从下面模板中选择:` : '请选择一个模板框架:',
            options: FRAMEWORKS.map((framework) => ({
              label: framework.color(framework.label),
              value: framework.value,
              hint: framework.hint,
            })),
          }),
        promptTempalteName: ({ results }) => {
          return p.select({
            message: '请选择一个项目模板:',
            options:
              FRAMEWORK_TEMPLATE[results.frameworkName ?? '']?.map((variant) => ({
                label: variant.color(variant.label),
                value: variant.value,
                hint: variant.hint,
              })) ?? [],
          });
        },
      },
      {
        onCancel: () => cancel(),
      },
    );
    tempalteName = t['promptTempalteName'];
  }

  const repo = TEMPLATES.filter((t) => t.value === tempalteName)[0]?.repo ?? '';

  const download = p.spinner();
  download.start('休息一下，模板正在生成 🏂');
  cleanDir(absTargetDir);
  await gitly(repo, absTargetDir, {});
  if (pkgName) {
    const pkg = new FileJson<PackageJson>(path.resolve(absTargetDir, 'package.json'));
    await pkg.r();
    pkg.d.name = pkgName;
    pkg.d.version = '0.0.1';
    await pkg.w();
  }
  download.stop('✓ 模板配置完成，请继续操作~');

  if (!areDirectoriesEqual(absTargetDir, cwd)) {
    console.log(
      kleur.green(`     cd ${relativeTargetDir.includes(' ') ? `"${relativeTargetDir}"` : relativeTargetDir}`),
    );
  }
  console.log(kleur.green(`     pnpm i`));
  console.log(kleur.green(`     pnpm dev`));
};

init().catch((e) => {
  consola.error(new Error(e));
});
