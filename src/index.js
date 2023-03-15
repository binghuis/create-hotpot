"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
var minimist_1 = require("minimist");
var prompts_1 = require("prompts");
var kolorist_1 = require("kolorist");
var constant_1 = require("./constant");
/** 文件名映射表 */
var renameFiles = {
    _gitignore: ".gitignore"
};
var argv = minimist_1["default"](process.argv.slice(2), { string: ["_"] });
var cwd = process.cwd();
var TEMPLATES = constant_1.FRAMEWORKS.map(function (f) { return (f.variants && f.variants.map(function (v) { return v.name; })) || [f.name]; }).reduce(function (a, b) { return a.concat(b); }, []);
var defaultTargetDir = "my-doll-project";
function init() {
    return __awaiter(this, void 0, void 0, function () {
        var argTargetDir, argTemplate, targetDir, getProjectName, result, cancelled_1, framework, overwrite, packageName, variant, root, template, templateDir, write, files, _i, _a, file, pkg, cdProjectName;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    argTargetDir = formatTargetDir(argv._[0]);
                    argTemplate = argv.template || argv.t;
                    targetDir = argTargetDir || defaultTargetDir;
                    getProjectName = function () {
                        return targetDir === "." ? node_path_1["default"].basename(node_path_1["default"].resolve()) : targetDir;
                    };
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, prompts_1["default"]([
                            {
                                type: argTargetDir ? null : "text",
                                name: "projectName",
                                message: kolorist_1.reset("项目名:"),
                                initial: defaultTargetDir,
                                onState: function (state) {
                                    targetDir = formatTargetDir(state.value) || defaultTargetDir;
                                }
                            },
                            {
                                type: function () {
                                    return !node_fs_1["default"].existsSync(targetDir) || isEmpty(targetDir) ? null : "confirm";
                                },
                                name: "overwrite",
                                message: function () {
                                    return (targetDir === "." ? "当前目录" : "\u76EE\u6807\u76EE\u5F55 \"" + targetDir + "\"") +
                                        " \u5DF2\u5B58\u5728\u6587\u4EF6\u3002\u662F\u5426\u6E05\u7A7A\u5E76\u7EE7\u7EED\u521B\u5EFA\uFF1F";
                                }
                            },
                            {
                                type: function (_, _a) {
                                    var overwrite = _a.overwrite;
                                    if (overwrite === false) {
                                        throw new Error(kolorist_1.red("✖") + " 操作已取消");
                                    }
                                    return null;
                                },
                                name: "overwriteChecker"
                            },
                            {
                                type: function () { return (isValidPackageName(getProjectName()) ? null : "text"); },
                                name: "packageName",
                                message: kolorist_1.reset("输入 package.json 名:"),
                                initial: function () { return toValidPackageName(getProjectName()); },
                                validate: function (dir) {
                                    return isValidPackageName(dir) || "无效的 package.json 名，请重新输入";
                                }
                            },
                            {
                                type: argTemplate && TEMPLATES.includes(argTemplate) ? null : "select",
                                name: "framework",
                                message: typeof argTemplate === "string" && !TEMPLATES.includes(argTemplate)
                                    ? kolorist_1.reset("\u6A21\u677F \"" + argTemplate + "\" \u4E0D\u5B58\u5728\u3002\u8BF7\u4ECE\u4E0B\u9762\u6A21\u677F\u4E2D\u9009\u62E9:")
                                    : kolorist_1.reset("请选择一个模板构建项目:"),
                                initial: 0,
                                choices: constant_1.FRAMEWORKS.map(function (framework) {
                                    var frameworkColor = framework.color;
                                    return {
                                        title: frameworkColor(framework.display || framework.name),
                                        value: framework
                                    };
                                })
                            },
                            {
                                type: function (framework) {
                                    return framework && framework.variants ? "select" : null;
                                },
                                name: "variant",
                                message: kolorist_1.reset("请选择一个模板变体:"),
                                choices: function (framework) {
                                    return framework.variants.map(function (variant) {
                                        var variantColor = variant.color;
                                        return {
                                            title: variantColor(variant.display || variant.name),
                                            value: variant.name
                                        };
                                    });
                                }
                            },
                        ], {
                            onCancel: function () {
                                throw new Error(kolorist_1.red("✖") + " 操作已取消");
                            }
                        })];
                case 2:
                    result = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    cancelled_1 = _b.sent();
                    console.log(cancelled_1.message);
                    return [2 /*return*/];
                case 4:
                    framework = result.framework, overwrite = result.overwrite, packageName = result.packageName, variant = result.variant;
                    root = node_path_1["default"].join(cwd, targetDir);
                    if (overwrite) {
                        emptyDir(root);
                    }
                    else if (!node_fs_1["default"].existsSync(root)) {
                        node_fs_1["default"].mkdirSync(root, { recursive: true });
                    }
                    template = variant || framework ? .name || argTemplate : ;
                    console.log("\n\u9879\u76EE\u6B63\u5728\u76EE\u5F55 " + root + " \u642D\u5EFA\u4E2D...");
                    templateDir = node_path_1["default"].resolve(node_url_1.fileURLToPath(import.meta.url), "../..", "template-" + template);
                    write = function (file, content) {
                        var targetPath = node_path_1["default"].join(root, renameFiles[file] ?  ? file :  : );
                        if (content) {
                            node_fs_1["default"].writeFileSync(targetPath, content);
                        }
                        else {
                            copy(node_path_1["default"].join(templateDir, file), targetPath);
                        }
                    };
                    files = node_fs_1["default"].readdirSync(templateDir);
                    for (_i = 0, _a = files.filter(function (f) { return f !== "package.json"; }); _i < _a.length; _i++) {
                        file = _a[_i];
                        write(file);
                    }
                    pkg = JSON.parse(node_fs_1["default"].readFileSync(node_path_1["default"].join(templateDir, "package.json"), "utf-8"));
                    pkg.name = packageName || getProjectName();
                    write("package.json", JSON.stringify(pkg, null, 2) + "\n");
                    cdProjectName = node_path_1["default"].relative(cwd, root);
                    console.log("\n\u642D\u5EFA\u6210\u529F\uFF0C\u8BF7\u7EE7\u7EED\u8F93\u5165:\n");
                    if (root !== cwd) {
                        console.log("  cd " + (cdProjectName.includes(" ") ? "\"" + cdProjectName + "\"" : cdProjectName));
                    }
                    console.log("  pnpm i");
                    console.log("  pnpm dev");
                    return [2 /*return*/];
            }
        });
    });
}
/** 去掉两端空格，并替换掉字符串末尾的一个或多个斜杠（/），以确保目标目录的格式正确 */
function formatTargetDir(targetDir) {
    return targetDir ? .trim().replace(/\/+$/g, "") : ;
}
/** 验证用户输入的项目名称是否符合命名规范 */
function isValidPackageName(projectName) {
    return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(projectName);
}
/** 将用户输入的项目名称转换为一个符合命名规范的字符串 */
function toValidPackageName(projectName) {
    return projectName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-") // 匹配所有空格，并用连字符 - 替换
        .replace(/^[._]/, "") // 匹配开头的点号或下划线，将其删除
        .replace(/[^a-z\d\-~]+/g, "-"); // 匹配所有非小写字母、数字、连字符、波浪线的字符，并用连字符 - 替换
}
/** 将一个目录下的所有文件和子目录复制到另一个目录中 */
function copyDir(srcDir, destDir) {
    node_fs_1["default"].mkdirSync(destDir, { recursive: true });
    for (var _i = 0, _a = node_fs_1["default"].readdirSync(srcDir); _i < _a.length; _i++) {
        var file = _a[_i];
        var srcFile = node_path_1["default"].resolve(srcDir, file);
        var destFile = node_path_1["default"].resolve(destDir, file);
        copy(srcFile, destFile);
    }
}
/** 将一个文件或目录复制到另一个位置 */
function copy(src, dest) {
    var stat = node_fs_1["default"].statSync(src);
    if (stat.isDirectory()) {
        copyDir(src, dest);
    }
    else {
        node_fs_1["default"].copyFileSync(src, dest);
    }
}
/** 判断项目目录是否为空 */
function isEmpty(path) {
    var files = node_fs_1["default"].readdirSync(path);
    return files.length === 0 || (files.length === 1 && files[0] === ".git");
}
/** 清空指定目录下的所有文件和子目录 */
function emptyDir(dir) {
    if (!node_fs_1["default"].existsSync(dir)) {
        return;
    }
    for (var _i = 0, _a = node_fs_1["default"].readdirSync(dir); _i < _a.length; _i++) {
        var file = _a[_i];
        if (file === ".git") {
            continue;
        }
        node_fs_1["default"].rmSync(node_path_1["default"].resolve(dir, file), { recursive: true, force: true });
    }
}
init()["catch"](function (e) {
    console.error(e);
});
