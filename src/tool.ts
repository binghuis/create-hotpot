import fs from 'fs-extra';
import path from 'node:path';

export const isEmptyDir = (path: string) => {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
};

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

export function areDirectoriesEqual(path1: string, path2: string) {
  return path.resolve(path1) === path.resolve(path2);
}

export function isPathValid(filePath: string) {
  return path.normalize(filePath) === filePath;
}
