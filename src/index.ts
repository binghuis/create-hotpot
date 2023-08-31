#! /usr/bin/env node

import path from 'node:path';
import * as p from '@clack/prompts';
import { cli } from 'cleye';
import { consola } from 'consola';
import filenamify from 'filenamify';
import fs from 'fs-extra';
import gitly from 'gitly';
import kleur from 'kleur';
import validate from 'validate-npm-package-name';
import pkg from '../package.json';
import { FRAMEWORKS, TEMPLATES } from './template';
import { isEmptyDir } from './tool';
import { Framework, FrameworkVariant } from './type';
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
    description: `@author ${pkg.author}`,
    usage: ['pnpm create hotpot', 'pnpm create hotpot [target dir] -t [template name]'],
  },
});

const {
  flags: { template: argTemplateName },
  _: { targetDir: argTargetDir },
} = argv;

const cancel = () => {
  p.cancel('✖ 操作已取消');
  process.exit(0);
};

const cwd = process.cwd();
const defaultTargetDir = 'my-hotpot';

const init = async () => {
  let targetDir = argTargetDir ?? '';
  if (!targetDir) {
    targetDir = (await p.text({
      message: '项目名:',
      placeholder: defaultTargetDir,
      defaultValue: defaultTargetDir,
    })) as string;
  }

  const absTargetDir = path.resolve(cwd, targetDir);
  const relativeTargetDir = path.relative(cwd, absTargetDir);

  const getProjectName = () => path.basename(targetDir === '.' ? cwd : targetDir);
  console.log(getProjectName());
  if (!fs.existsSync(absTargetDir)) {
    fs.ensureDirSync(absTargetDir);
  } else if (!isEmptyDir(absTargetDir)) {
    const overwrite = (await p.confirm({
      message: `${targetDir === '.' ? '当前目录' : `目标目录 "${targetDir}" `}已存在文件。是否清空并继续创建？`,
    })) as boolean;

    if (overwrite) {
      fs.emptyDirSync(absTargetDir);
    } else {
      cancel();
    }
  }

  let tempalteName: string = argTemplateName ?? '';
  if (!tempalteName) {
    const t = await p.group<{
      frameworkName: Framework['value'] | symbol;
      promptTempalteName: FrameworkVariant['value'] | symbol;
    }>(
      {
        frameworkName: () =>
          p.select({
            message:
              argTemplateName && TEMPLATES.map((t) => t.value).includes(argTemplateName)
                ? `模板 "${argTemplateName}" 不存在。请从下面模板中选择:`
                : '请选择一个框架模板:',
            options: FRAMEWORKS.filter((framework) => !framework.disabled && framework.variants.length > 0).map(
              (framework) => ({
                label: framework.color(framework.label),
                value: framework.value,
                hint: framework.hint,
              }),
            ),
          }),
        promptTempalteName: ({ results }) =>
          p.select({
            message: '请选择一个项目模板:',
            options:
              FRAMEWORKS.filter((framework) => framework.value === results.frameworkName)[0]
                ?.variants.filter((variant) => variant.repo)
                .map((variant) => ({
                  label: variant.color(variant.label),
                  value: variant.value,
                  hint: variant.hint,
                })) ?? [],
          }),
      },
      {
        onCancel: cancel,
      },
    );
    tempalteName = t['promptTempalteName'];
  }

  const template = TEMPLATES.filter((t) => t.value === tempalteName)[0];

  const download = p.spinner();
  download.start('休息一下，模板正在生成 🏂');
  await gitly(template?.repo as string, absTargetDir, {});
  download.stop(kleur.green('✓ 模板配置完成，请继续操作~'));

  if (absTargetDir !== cwd) {
    console.log(`     cd ${relativeTargetDir.includes(' ') ? `"${relativeTargetDir}"` : relativeTargetDir}`);
  }
  console.log(`     pnpm i`);
  console.log(`     pnpm dev`);
};

init().catch((e) => {
  consola.error(new Error(e));
});
