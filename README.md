# Create-Hotpot

`create-hotpot` 是一个命令行工具，用于快速生成项目模板。

## 使用

在终端中输入以下命令来使用该工具：

```
pnpm create hotpot <project-directory>
```

`<project-directory>` 参数是可选的，如果不传，则默认使用 `my-hotpot` 作为项目目录名称。

该命令会询问一些选项来生成项目。比如，选择项目模板，指定项目名称和包名称等。可以通过 `-t` 或 `--template` 选项来指定项目模板，如下所示：

```
pnpm create hotpot -t react-desktop
```

