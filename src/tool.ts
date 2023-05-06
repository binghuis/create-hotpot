import { Framework, FrameworkVariant } from './type';
import fs from 'node:fs';
import path from 'node:path';

/** 格式化目标目录 */
export const formatTargetDir = (targetDir: string | undefined) => {
  return targetDir?.trim().replace(/\/+$/g, '');
};

/** 项目名是否符合规范 */
export const isValidPackageName = (projectName: string) => {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  );
};

/** 将用户输入的项目名称转换为一个符合命名规范的字符串 */
export const toValidPackageName = (projectName: string) => {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // 匹配所有空格，并用连字符 - 替换
    .replace(/^[._]/, '') // 匹配开头的点号或下划线，将其删除
    .replace(/[^a-z\d\-~]+/g, '-'); // 匹配所有非小写字母、数字、连字符、波浪线的字符，并用连字符 - 替换
};

/** 目录是否为空 */
export const isEmpty = (path: string) => {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
};

/** 清空指定目录下的所有文件和子目录 */
export const cleanDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue;
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
};

export const findRepoByName = (name: string, frameworks: (Framework | FrameworkVariant)[],): string | undefined => {
  for (const f of frameworks) {
    if ('variants' in f) {
      return findRepoByName(name, f.variants);
    }
    if ('repo' in f && f.name === name) {
      return f.repo;
    }
  }
};
