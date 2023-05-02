import { join } from 'node:path'
import type { ExecaSyncReturnValue, SyncOptions } from 'execa'
import { execaCommandSync } from 'execa'
import fs from 'fs-extra'
import { afterEach, beforeAll, expect, test } from 'vitest'

const CLI_PATH = join(__dirname, '..')

const projectName = 'test-app'
const genPath = join(__dirname, projectName)

const run = (
  args: string[],
  options: SyncOptions = {},
): ExecaSyncReturnValue => {
  return execaCommandSync(`node ${CLI_PATH} ${args.join(' ')}`, options)
}

const createNonEmptyDir = () => {
  fs.mkdirpSync(genPath)
  const pkgJson = join(genPath, 'package.json')
  fs.writeFileSync(pkgJson, '{ "foo": "bar" }')
}

// const templateFiles = fs
//   .readdirSync(join(CLI_PATH, 'react-desktop'))
//   // _gitignore is renamed to .gitignore
//   .map((filePath) => (filePath === '_gitignore' ? '.gitignore' : filePath))
//   .sort()

beforeAll(() => fs.remove(genPath))
afterEach(() => fs.remove(genPath))

test('直接执行CLI命令，不传参', () => {
  const { stdout } = run([])
  expect(stdout).toContain('项目名:')
})

test('仅传项目构建目录', () => {
  fs.mkdirpSync(genPath)
  const { stdout } = run(['.'], { cwd: genPath })
  expect(stdout).toContain('请选择一个项目模板:')
})

test('仅传项目名', () => {
  const { stdout } = run([projectName])
  expect(stdout).toContain('请选择一个项目模板:')
})

test('传项目名和 --template 参数', () => {
  const { stdout } = run([projectName, '--template'])
  expect(stdout).toContain('请选择一个项目模板:')
})

test('传项目名和一个无效的 --template', () => {
  const { stdout } = run([projectName, '--template', 'unknown'])
  expect(stdout).toContain(
    `模板 "unknown" 不存在。请从下面模板中选择:`,
  )
})

test('目标目录非空', () => {
  createNonEmptyDir()
  const { stdout } = run([projectName], { cwd: __dirname })
  expect(stdout).toContain(`目标目录 "${projectName}" 已存在文件。是否清空并继续创建？`)
})

test('目标（当前）目录非空', () => {
  createNonEmptyDir()
  const { stdout } = run(['.'], { cwd: genPath })
  expect(stdout).toContain(`当前目录已存在文件。是否清空并继续创建？`)
})

// test('successfully scaffolds a project based on vue starter template', () => {
//   const { stdout } = run([projectName, '--template', 'vue'], {
//     cwd: __dirname,
//   })
//   const generatedFiles = fs.readdirSync(genPath).sort()

//   // Assertions
//   expect(stdout).toContain(`Scaffolding project in ${genPath}`)
//   expect(templateFiles).toEqual(generatedFiles)
// })

// test('works with the -t alias', () => {
//   const { stdout } = run([projectName, '-t', 'vue'], {
//     cwd: __dirname,
//   })
//   const generatedFiles = fs.readdirSync(genPath).sort()

//   // Assertions
//   expect(stdout).toContain(`Scaffolding project in ${genPath}`)
//   expect(templateFiles).toEqual(generatedFiles)
// })
