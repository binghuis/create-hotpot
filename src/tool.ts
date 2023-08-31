import path from 'node:path';
import fs from 'fs-extra';

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

export function areDirectoriesEqual(path1: string, path2: string) {
  return path.resolve(path1) === path.resolve(path2);
}
