import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import spawn from "cross-spawn";
import minimist from "minimist";
import prompts from "prompts";
import { blue, cyan, green, red, reset, yellow } from "kolorist";

type ColorFunc = (str: string | number) => string;

/** 前端框架的配置信息 */
type Framework = {
  /** 名称 */
  name: string;
  /** 显示名称 */
  display: string;
  color: ColorFunc;
  /** 该框架的所有变体 */
  variants: FrameworkVariant[];
};

/** 前端框架的变体配置信息 */
type FrameworkVariant = {
  name: string;
  display: string;
  color: ColorFunc;
  customCommand?: string;
};

const argv = minimist<{
  t?: string;
  template?: string;
}>(process.argv.slice(2), { string: ["_"] });

const cwd = process.cwd();

/** 各种前端框架的配置信息 */
const FRAMEWORKS: Framework[] = [
  {
    name: "vue",
    display: "Vue",
    color: green,
    variants: [
      {
        name: "vue-mobile",
        display: "Mobile Site",
        color: yellow,
      },
      {
        name: "vue-desktop",
        display: "Desktop Site",
        color: blue,
      },
    ],
  },
  {
    name: "react",
    display: "React",
    color: cyan,
    variants: [
      {
        name: "react-mobile",
        display: "Mobile Site",
        color: yellow,
      },
      {
        name: "react-desktop",
        display: "Desktop Site",
        color: blue,
      },
    ],
  },
];

const TEMPLATES = FRAMEWORKS.map(
  (f) => (f.variants && f.variants.map((v) => v.name)) || [f.name]
).reduce((a, b) => a.concat(b), []);

/** 文件名映射表 */
const renameFiles: Record<string, string | undefined> = {
  _gitignore: ".gitignore",
};

const defaultTargetDir = "my-doll-project";

async function init() {
  /** 表示用户在命令行中输入的第一个非选项参数，即目标目录的名称 */
  const argTargetDir = formatTargetDir(argv._[0]);
  /** 获取命令行参数 --template 或 -t 的值 */
  const argTemplate = argv.template || argv.t;

  let targetDir = argTargetDir || defaultTargetDir;

  const getProjectName = () =>
    targetDir === "." ? path.basename(path.resolve()) : targetDir;

  let result: prompts.Answers<
    "projectName" | "overwrite" | "packageName" | "framework" | "variant"
  >;

  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : "text",
          name: "projectName",
          message: reset("Project name:"),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir;
          },
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : "confirm",
          name: "overwrite",
          message: () =>
            (targetDir === "." ? "当前目录" : `目标目录 "${targetDir}"`) +
            ` 不为空。 删除现有文件并继续？`,
        },
        {
          type: (_, { overwrite }: { overwrite?: boolean }) => {
            if (overwrite === false) {
              throw new Error(red("✖") + " 操作已取消");
            }
            return null;
          },
          name: "overwriteChecker",
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : "text"),
          name: "packageName",
          message: reset("Package name:"),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) =>
            isValidPackageName(dir) || "无效的 package.json 名称",
        },
        {
          type:
            argTemplate && TEMPLATES.includes(argTemplate) ? null : "select",
          name: "framework",
          message:
            typeof argTemplate === "string" && !TEMPLATES.includes(argTemplate)
              ? reset(`"${argTemplate}" 模板不存在。请从下面选择：`)
              : reset("选择一个模板。"),
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
            framework && framework.variants ? "select" : null,
          name: "variant",
          message: reset("Select a variant:"),
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
          throw new Error(red("✖") + " 操作已取消");
        },
      }
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

  let template: string = variant || framework?.name || argTemplate;

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : "npm";

  const isYarn1 = pkgManager === "yarn" && pkgInfo?.version.startsWith("1.");

  const { customCommand } =
    FRAMEWORKS.flatMap((f) => f.variants).find((v) => v.name === template) ??
    {};

  if (customCommand) {
    const fullCustomCommand = customCommand
      .replace(/^npm create/, `${pkgManager} create`)
      // Only Yarn 1.x doesn't support `@version` in the `create` command
      .replace("@latest", () => (isYarn1 ? "" : "@latest"))
      .replace(/^npm exec/, () => {
        // Prefer `pnpm dlx` or `yarn dlx`
        if (pkgManager === "pnpm") {
          return "pnpm dlx";
        }
        if (pkgManager === "yarn" && !isYarn1) {
          return "yarn dlx";
        }
        // Use `npm exec` in all other cases,
        // including Yarn 1.x and other custom npm clients.
        return "npm exec";
      });

    const [command, ...args] = fullCustomCommand.split(" ");
    // we replace TARGET_DIR here because targetDir may include a space
    const replacedArgs = args.map((arg) =>
      arg.replace("TARGET_DIR", targetDir)
    );
    const { status } = spawn.sync(command, replacedArgs, {
      stdio: "inherit",
    });
    process.exit(status ?? 0);
  }

  console.log(`\nScaffolding project in ${root}...`);
  /**
   * 这段代码使用了 path.resolve 方法，用于将多个路径解析为一个绝对路径，其中：
   * fileURLToPath 方法将 import.meta.url 对象转换为文件路径字符串。
   * ../.. 表示当前文件所在目录的上上级目录。
   * template-${template} 是一个路径片段，用于构造最终路径。它将被添加到 ../.. 后面，
   * 形成一个新的路径，指向名为 template-<template> 的目录，其中 <template> 是变量。
   * 总之，这段代码的作用是构造模板目录的绝对路径。最终结果将被赋值给 templateDir 变量。
   */
  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    "../..",
    `template-${template}`
  );

  /**
   * 将模板目录中的文件拷贝到目标目录，并根据 renameFiles 对象对文件进行重命名。
   * 具体来说，如果 content 参数存在，则直接将其写入到 targetPath 文件中，
   * 否则从模板目录中拷贝对应的文件到 targetPath 中。如果 renameFiles 中存在对应的文件名，
   * 则使用重命名后的文件名，否则使用原始文件名。
   */
  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  /**
   * fs.readdirSync(path) 方法返回一个数组，其中包含指定目录中的文件名和子目录名称。
   * 它的参数 path 是一个字符串，表示要读取的目录的路径。在这里，templateDir
   * 是通过解析 template-${template} 目录得到的，即模板的目录。这个方法用来获取模板目录下的所有文件和子目录的名称。
   */
  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== "package.json")) {
    write(file);
  }

  /** 根据用户输入的项目名称或者默认的名称来修改 package.json 文件中的 name 字段 */
  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), "utf-8")
  );

  pkg.name = packageName || getProjectName();

  write("package.json", JSON.stringify(pkg, null, 2) + "\n");

  /** 指定在项目目录下运行的 cd 命令所要进入的目录名。它的值是将当前工作目录 cwd 和新建的项目目录 root 取相对路径得到的。 */
  const cdProjectName = path.relative(cwd, root);
  console.log(`\nDone. Now run:\n`);
  /**
   * 这段代码是用来输出 cd 命令，以便用户可以快速进入项目根目录。它检查项目根目录是否与当前工作目录相同，
   * 如果不同，则输出 cd 命令。cd 命令后跟的是项目根目录的相对路径。如果项目根目录包含空格，则路径会被双引号引起来。
   * 例如，如果项目根目录为 /Users/john/my project，则输出 cd "my project"。
   */
  if (root !== cwd) {
    console.log(
      `  cd ${
        cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName
      }`
    );
  }

  /**
   * 这个代码块是输出在终端的一些提示，根据包管理工具的不同输出不同的命令提示。
   * 如果包管理工具是 yarn ，则输出 "yarn" 和 "yarn dev"，否则输出 "npm install"
   * 和 "npm run dev"（其中 npm 可以替换为其他包管理工具的名称）。这些命令是用来安装依赖和启动项目的。
   */
  switch (pkgManager) {
    case "yarn":
      console.log("  yarn");
      console.log("  yarn dev");
      break;
    default:
      console.log(`  ${pkgManager} install`);
      console.log(`  ${pkgManager} run dev`);
      break;
  }
  console.log();
}

/** 去掉两端空格，并替换掉字符串末尾的一个或多个斜杠（/），以确保目标目录的格式正确 */
function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, "");
}

/** 验证用户输入的项目名称是否符合命名规范 */
function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName
  );
}

/** 将用户输入的项目名称转换为一个符合命名规范的字符串 */
function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // 匹配所有空格，并用连字符 - 替换
    .replace(/^[._]/, "") // 匹配开头的点号或下划线，将其删除
    .replace(/[^a-z\d\-~]+/g, "-"); // 匹配所有非小写字母、数字、连字符、波浪线的字符，并用连字符 - 替换
}

/** 将一个目录下的所有文件和子目录复制到另一个目录中 */
function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

/** 将一个文件或目录复制到另一个位置 */
function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

/** 判断项目目录是否为空 */
function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === ".git");
}

/** 清空指定目录下的所有文件和子目录 */
function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === ".git") {
      continue;
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
  }
}

/** 从用户代理中提取出包名和版本信息 */
function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(" ")[0];
  const pkgSpecArr = pkgSpec.split("/");
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}

init().catch((e) => {
  console.error(e);
});
