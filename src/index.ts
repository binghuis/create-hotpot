import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import spawn from "cross-spawn";
import minimist from "minimist";
import prompts from "prompts";
import {
  blue,
  cyan,
  green,
  lightGreen,
  lightRed,
  magenta,
  red,
  reset,
  yellow,
} from "kolorist";

/**
 * 解析命令行参数，_ 数组中包含的是所有没有被解析的参数，_ 参数的类型指定为字符串
 * pnpm create doll my-project -t react-ts
 * process.argv 表示整个命令行参数的数组，而 .slice(2) 表示从数组的第三个元素（下标为2）开始截取，
 * 因为前两个元素是 node 和执行的脚本文件路径[  '/usr/local/bin/node',  '/Users/yourname/path/to/your/app.js']。
 * 所以 process.argv.slice(2) 的结果就是 ["create", "doll", "my-project", "-t", "react-ts"]，其中包括了我们输入的参数和选项。
 * @example
 * {
 *   _: ['create', 'doll', 'my-project'],
 *   t: 'react-ts',
 *   template: 'react-ts'
 * }
 */
const argv = minimist<{
  t?: string;
  template?: string;
}>(process.argv.slice(2), { string: ["_"] });

/** 当前的工作目录的绝对路径名 */
const cwd = process.cwd();

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

/** 各种前端框架的配置信息 */
const FRAMEWORKS: Framework[] = [
  {
    name: "vanilla",
    display: "Vanilla",
    color: yellow,
    variants: [
      {
        name: "vanilla",
        display: "JavaScript",
        color: yellow,
      },
      {
        name: "vanilla-ts",
        display: "TypeScript",
        color: blue,
      },
    ],
  },
  {
    name: "vue",
    display: "Vue",
    color: green,
    variants: [
      {
        name: "vue",
        display: "JavaScript",
        color: yellow,
      },
      {
        name: "vue-ts",
        display: "TypeScript",
        color: blue,
      },
      {
        name: "custom-create-vue",
        display: "Customize with create-vue ↗",
        color: green,
        customCommand: "npm create vue@latest TARGET_DIR",
      },
      {
        name: "custom-nuxt",
        display: "Nuxt ↗",
        color: lightGreen,
        customCommand: "npm exec nuxi init TARGET_DIR",
      },
    ],
  },
  {
    name: "react",
    display: "React",
    color: cyan,
    variants: [
      {
        name: "react",
        display: "JavaScript",
        color: yellow,
      },
      {
        name: "react-ts",
        display: "TypeScript",
        color: blue,
      },
      {
        name: "react-swc",
        display: "JavaScript + SWC",
        color: yellow,
      },
      {
        name: "react-swc-ts",
        display: "TypeScript + SWC",
        color: blue,
      },
    ],
  },
  {
    name: "preact",
    display: "Preact",
    color: magenta,
    variants: [
      {
        name: "preact",
        display: "JavaScript",
        color: yellow,
      },
      {
        name: "preact-ts",
        display: "TypeScript",
        color: blue,
      },
    ],
  },
  {
    name: "lit",
    display: "Lit",
    color: lightRed,
    variants: [
      {
        name: "lit",
        display: "JavaScript",
        color: yellow,
      },
      {
        name: "lit-ts",
        display: "TypeScript",
        color: blue,
      },
    ],
  },
  {
    name: "svelte",
    display: "Svelte",
    color: red,
    variants: [
      {
        name: "svelte",
        display: "JavaScript",
        color: yellow,
      },
      {
        name: "svelte-ts",
        display: "TypeScript",
        color: blue,
      },
      {
        name: "custom-svelte-kit",
        display: "SvelteKit ↗",
        color: red,
        customCommand: "npm create svelte@latest TARGET_DIR",
      },
    ],
  },
  {
    name: "others",
    display: "Others",
    color: reset,
    variants: [
      {
        name: "create-vite-extra",
        display: "create-vite-extra ↗",
        color: reset,
        customCommand: "npm create vite-extra@latest TARGET_DIR",
      },
    ],
  },
];

/** 包含所有可用的模板名称，包括每个框架的名称和每个框架变体的名称 */
const TEMPLATES = FRAMEWORKS.map(
  (f) => (f.variants && f.variants.map((v) => v.name)) || [f.name]
).reduce((a, b) => a.concat(b), []);

/** 将_gitignore字符串重命名为.gitignore */
const renameFiles: Record<string, string | undefined> = {
  _gitignore: ".gitignore",
};

/** 默认目标目录 */
const defaultTargetDir = "vite-project";

async function init() {
  /** 表示用户在命令行中输入的第一个非选项参数，即目标目录的名称 */
  const argTargetDir = formatTargetDir(argv._[0]);
  /** 获取命令行参数 --template 或 -t 的值 */
  const argTemplate = argv.template || argv.t;

  /** 如果没有输入目标目录名，则采用默认目标目录 */
  let targetDir = argTargetDir || defaultTargetDir;
  /**
   * 该函数用于获取项目名称。如果用户没有指定目标目录，则默认为 "vite-project"。
   * 如果用户指定的目标目录为当前目录（即 "."），则获取当前目录的名称作为项目名称，
   * 否则使用用户指定的目标目录作为项目名称。
   */
  const getProjectName = () =>
    targetDir === "." ? path.basename(path.resolve()) : targetDir;

  /** 存储用户输入的答案 */
  let result: prompts.Answers<
    "projectName" | "overwrite" | "packageName" | "framework" | "variant"
  >;

  try {
    /**
     * 这一段代码是用来添加用户交互的，根据不同的情况来返回不同类型的交互方式，例如：
     * 对于项目名称（projectName），如果有指定参数，则默认为文本类型，否则为文本类型
     * 对于覆盖已有文件（overwrite），如果目标目录存在且不为空，则返回一个确认类型，否则为 null
     * 对于包名称（packageName），如果项目名称为有效的包名称，则返回 null，否则为文本类型
     * 对于选择框架（framework），如果指定了有效的模板（template）且存在对应的框架，则返回 null，否则为选择类型
     * 对于选择变种（variant），如果选中的框架有变种，则返回选择类型，否则为 null
     * 这样通过 prompts 库的不同交互类型和各个选项之间的互动就可以构建一个完整的命令行交互过程。
     */
    result = await prompts(
      [
        /**
         * 如果已经在命令行中指定了要创建项目的目标目录（即argTargetDir有值），则不需要再让用户输入目录名，
         * 因此在这种情况下，type被设置为null，从而禁用了该提示的输入功能，让用户可以直接跳过这一步，而进入下一步的提示。
         * 如果argTargetDir没有值，则会要求用户输入一个目录名作为项目名称。
         */
        {
          type: argTargetDir ? null : "text",
          name: "projectName",
          message: reset("Project name:"),
          initial: defaultTargetDir,
          onState: (state) => {
            /** 如果没有输入目标目录名，则采用命令行交互中用户输入的目录名 */
            targetDir = formatTargetDir(state.value) || defaultTargetDir;
          },
        },
        /**
         * 这个交互用来询问用户是否希望删除已存在的目录以继续创建项目。
         * 其中，type 属性是一个函数，用于根据当前的目标目录是否存在文件，来判断该交互是否需要展示。
         * 当目标目录不存在或为空时，交互不需要展示，此时 type 返回 null。如果目标目录存在文件，则询问用户是否需要继续。
         * 在此情况下，type 返回 "confirm" 类型，表示展示一个确认对话框。
         * 对于 message 属性，根据目标目录是否为当前目录，生成不同的提示信息，询问用户是否继续。如果目标目录是当前目录，
         * 则提示信息为 Current directory is not empty. Remove existing files and continue?；
         * 否则，提示信息为 Target directory "${targetDir}" is not empty. Remove existing files and continue?。
         */
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : "confirm",
          name: "overwrite",
          message: () =>
            (targetDir === "."
              ? "Current directory"
              : `Target directory "${targetDir}"`) +
            ` is not empty. Remove existing files and continue?`,
        },
        /**
         * 这一部分是一个 prompt 对象的属性，用于在用户输入确认之后才继续进行下一步。在这个对象中，
         * type 函数会根据上一个 prompt 的结果来判断是否需要进行该步骤。如果目标目录不为空，会提醒用户是否需要覆盖原有的文件；
         * 用户需要确认之后，overwriteChecker 中的函数才会执行，用于确认用户是否同意覆盖原有文件。
         * 如果用户拒绝，会抛出一个异常中断程序，否则继续执行。
         */
        {
          type: (_, { overwrite }: { overwrite?: boolean }) => {
            if (overwrite === false) {
              throw new Error(red("✖") + " Operation cancelled");
            }
            return null;
          },
          name: "overwriteChecker",
        },
        /**
         * 在这个例子中，type函数返回一个校验包名是否合法的函数。如果包名合法，返回 null，否则返回 "text"。
         * initial属性返回包名格式化后的结果，validate则在用户回答后进行校验。
         */
        {
          type: () => (isValidPackageName(getProjectName()) ? null : "text"),
          name: "packageName",
          message: reset("Package name:"),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) =>
            isValidPackageName(dir) || "Invalid package.json name",
        },
        /**
         * 这段代码使用了 select 类型的交互，用于让用户选择一个框架（framework）。
         * 如果用户提供了 --template 或 -t 参数，并且该参数值在预定义的模板列表 TEMPLATES 中，那么该交互将被跳过。
         * 否则，该交互将使用 select 类型，显示所有可用的框架。每个框架都会显示一个颜色和一个名称，名称来自于 FRAMEWORKS 数组中的元素，
         * 该数组列出了所有可用的框架。用户将能够通过键盘选择一个框架。初始值为第一个框架，即 0。
         */
        {
          type:
            argTemplate && TEMPLATES.includes(argTemplate) ? null : "select",
          name: "framework",
          message:
            typeof argTemplate === "string" && !TEMPLATES.includes(argTemplate)
              ? reset(
                  `"${argTemplate}" isn't a valid template. Please choose from below: `
                )
              : reset("Select a framework:"),
          initial: 0,
          choices: FRAMEWORKS.map((framework) => {
            const frameworkColor = framework.color;
            return {
              title: frameworkColor(framework.display || framework.name),
              value: framework,
            };
          }),
        },
        /**
         * 在这个例子中，choices参数会根据上一个交互“选择一个框架”的结果来决定展示哪些变体（如果框架有变体的话）。
         * 具体来说，它会检查上一个交互返回的Framework对象是否有variants属性，如果有，则说明这个框架有变体可供选择，
         * 就会返回一个select类型的交互，让用户选择一个变体；如果没有，就返回null，跳过这个交互。在用户选择了变体之后，
         * 这个变体的名称会被存储在result.variant中，可以在后续的代码中使用。
         *
         * 在这段代码中，type函数的第一个参数是前面的交互结果，第二个参数是一个包含前面所有交互结果的对象。
         * 在此特定的交互中，type函数的第一个参数framework的值是前一个交互 "Select a framework:" 所选择的框架对象。
         * 第二个参数包含前面所有交互的结果，如包名、项目名、是否覆盖等。
         */
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
      /**
       * 这段代码是为 prompts 库的 prompt 函数提供的一个选项对象，用于在用户取消操作时抛出错误并终止程序。
       * 如果用户在交互过程中按下 ctrl + C 或者点击了终止交互的按键，就会触发 onCancel 函数中抛出的错误。
       */
      {
        onCancel: () => {
          throw new Error(red("✖") + " Operation cancelled");
        },
      }
    );
  } catch (cancelled: any) {
    console.log(cancelled.message);
    return;
  }

  /** 获取前面交互中获取的参数值 */
  const { framework, overwrite, packageName, variant } = result;
  /** 项目根目录 */
  const root = path.join(cwd, targetDir);

  /** 如果允许覆盖，则先清空目标目录中的所有文件，然后创建一个空的目录。如果目标目录不存在，则创建一个新的目录。 */
  if (overwrite) {
    emptyDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  /** 这段代码首先会尝试获取变体名称 variant，如果不存在，会尝试获取框架名称 framework.name。如果两者都不存在，会获取命令行参数中的模板名称 argTemplate。 */
  let template: string = variant || framework?.name || argTemplate;
  let isReactSwc = false;
  /**
   * 当 variant 中包含 -swc 时，说明这是使用 @vitejs/create-app 创建的 React 项目，并且使用了 SWC 编译器作为构建工具，
   * SWC 是一种 JavaScript 代码编译器，能够将代码转换为更加高效的 JavaScript 代码，提高运行效率。
   * 所以这里将 variant 中的 -swc 删除，得到真正的模板名称，以便后续选择合适的模板进行创建。
   */
  if (template.includes("-swc")) {
    isReactSwc = true;
    template = template.replace("-swc", "");
  }
  /**
   * npm_config_user_agent是一个环境变量，它是在运行npm命令时自动生成的。
   * 这个环境变量包含了当前的npm版本、操作系统类型和当前的package manager信息。
   * 如果你同时使用了多个包管理工具，那么这个环境变量会反映出你当前所使用的包管理工具，
   * 你可以根据这个环境变量来判断使用哪个包管理工具。
   */
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : "npm";
  /**
   * 这段代码通过解析npm_config_user_agent环境变量中包管理器的信息，来判断当前的包管理器是npm还是yarn，
   * 并且如果当前的包管理器是yarn的旧版本（即版本号以1.开头），则将isYarn1设置为true
   */
  const isYarn1 = pkgManager === "yarn" && pkgInfo?.version.startsWith("1.");

  /**
   * 这段代码是用来获取特定模板的自定义命令。首先，flatMap 方法会把 FRAMEWORKS 数组里的每个 Framework 对象的 variants 数组展平成一个一维数组。
   * 接下来，find 方法会在这个一维数组中查找第一个 Variant 对象的 name 属性等于 template 的元素，如果找到了，
   * 就返回这个 Variant 对象的 customCommand 属性，否则返回 undefined。
   */
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

  if (isReactSwc) {
    setupReactSwc(root, template.endsWith("-ts"));
  }

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

/**
 * 将 React 项目中的 "@vitejs/plugin-react" 插件替换为 "@vitejs/plugin-react-swc" 插件
 * 以使用 SWC 转译器进行代码转译
 *
 * @param root 项目根目录的路径
 * @param isTs 是否使用 TypeScript
 */
function setupReactSwc(root: string, isTs: boolean) {
  editFile(path.resolve(root, "package.json"), (content) => {
    return content.replace(
      /"@vitejs\/plugin-react": ".+?"/,
      `"@vitejs/plugin-react-swc": "^3.0.0"`
    );
  });
  editFile(
    path.resolve(root, `vite.config.${isTs ? "ts" : "js"}`),
    (content) => {
      return content.replace(
        "@vitejs/plugin-react",
        "@vitejs/plugin-react-swc"
      );
    }
  );
}

/**
 * 读取指定路径的文件内容，并将其作为参数传递给 callback，callback 函数会处理文件内容，
 * 并将处理后的内容写入到指定路径的文件中。
 *
 * @param file 要编辑的文件的路径
 * @param callback 用于处理文件的内容
 */
function editFile(file: string, callback: (content: string) => string) {
  const content = fs.readFileSync(file, "utf-8");
  fs.writeFileSync(file, callback(content), "utf-8");
}

init().catch((e) => {
  console.error(e);
});
