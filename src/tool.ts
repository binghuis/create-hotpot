import path from 'node:path';
import fs from 'fs-extra';
import validateNpmPackageName from 'validate-npm-package-name';
import { Framework, FrameworkVariant } from './type';

/** 删除空格和结尾/ */
export const formatTargetDir = (targetDir: string) => {
  return targetDir.trim().replace(/\s+/g, '-').replace(/\/+$/g, '') ?? targetDir;
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
export const isEmptyDir = (path: string) => {
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

export function isDirPathValid(pathStr: string) {
  if (process.platform === 'win32') {
    // Windows 文件夹路径规范
    return !/[<>:"\/|?*]/.test(pathStr);
  }
  return true;
}
