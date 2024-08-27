#! /usr/bin/env node

import NanoJson from '@bit2byte/nano-json';
import * as p from '@clack/prompts';
import { cli } from 'cleye';
import { consola } from 'consola';
import fs from 'fs-extra';
import { downloadTemplate } from 'giget';
import kleur from 'kleur';
import path from 'node:path';
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
      description: 'Template Name',
      alias: 't',
    },
  },
  help: {
    version: pkg.version,
    description: pkg.homepage,
    usage: ['pnpm create hotpot', 'pnpm create hotpot [target dir] -t [template name]'],
  },
});

const {
  flags: { template },
  _: { targetDir: argTargetDir },
} = argv;

const cancel = (message?: string) => {
  p.cancel(message ?? '✖ 已取消');
  process.exit(0);
};

const defaultTargetDir = 'my-hotpot';

const main = async () => {
  let targetDir = argTargetDir ?? '';
  if (!targetDir) {
    targetDir = (await p.text({
      message: kleur.cyan('项目名:'),
      placeholder: defaultTargetDir,
      defaultValue: defaultTargetDir,
      validate(value) {
        if (!isPathValid(value ? value : defaultTargetDir)) {
          return '包含非法字符';
        }
      },
    })) as string;
  }

  if (p.isCancel(targetDir)) {
    cancel();
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
      message: kleur.yellow(
        `${
          areDirectoriesEqual(cwd, absTargetDir) ? '当前目录' : `目标目录 "${targetDir}" `
        }已存在文件。是否清空并继续创建？`,
      ),
    })) as boolean;

    if (p.isCancel(overwrite)) {
      cancel();
    }
  }

  let tempalteName = template ?? '';
  if (!TEMPLATE_NAMES.includes(tempalteName)) {
    const t = await p.group<{
      frameworkName: ValidFramework['value'] | symbol;
      promptTempalteName: ValidFrameworkVariant['value'] | symbol;
    }>(
      {
        frameworkName: () =>
          p.select({
            message: kleur.cyan(
              tempalteName
                ? `模板 "${tempalteName}" 不存在。请从下面模板中选择:`
                : '请选择一个模板框架:',
            ),
            options: FRAMEWORKS.map((framework) => ({
              label: framework.label,
              value: framework.value,
              hint: framework.hint,
            })),
          }),
        promptTempalteName: ({ results }) => {
          return p.select({
            message: kleur.cyan('请选择一个项目模板:'),
            options:
              FRAMEWORK_TEMPLATE[results.frameworkName ?? '']?.map((variant) => ({
                label: variant.label,
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
    tempalteName = t.promptTempalteName;
  }

  const repo = TEMPLATES.filter((t) => t.value === tempalteName)[0]?.repo ?? '';

  const download = p.spinner();
  download.start(kleur.cyan('休息一下，模板正在生成 🏂'));
  cleanDir(absTargetDir);
  await downloadTemplate(`github:${repo}`, { dir: absTargetDir });
  if (pkgName) {
    const pkg = new NanoJson<PackageJson>(path.join(absTargetDir, 'package.json'));
    await pkg.r();
    if (pkg.d) {
      pkg.d.name = pkgName;
      pkg.d.version = '0.0.1';
    }
    await pkg.w();
  }
  download.stop(kleur.green('✓ 模板配置完成，请继续操作:'));

  if (!areDirectoriesEqual(absTargetDir, cwd)) {
    console.log(
      `     cd ${relativeTargetDir.includes(' ') ? `"${relativeTargetDir}"` : relativeTargetDir}`,
    );
  }
  console.log('     pnpm i');
  console.log('     pnpm dev');
};

main().catch((e) => {
  consola.error(new Error(e));
});
