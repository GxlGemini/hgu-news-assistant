<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>
# 📘 HGU News Assistant - 项目构建与运行指南

---

## 1. 环境准备（Prerequisites）

在开始之前，请确保系统已安装以下环境：

- **Node.js**：推荐版本 `v18.x` 或 `v20.x`  
  （可通过 `node -v` 验证）
- **Git**：（可选）用于拉取项目代码
- **管理员权限**：Windows 系统建议以管理员身份运行终端

---

## 2. 初始化与依赖安装（Installation）

### 2.1 安装普通依赖

在项目根目录打开 PowerShell 或 CMD，执行：

```bash
npm install
```

### 2.2 编译原生模块（关键步骤）

项目使用了 `better-sqlite3`（Native 模块），其二进制文件必须与 **Electron 内部 Node 版本** 匹配，而不是系统 Node 版本。

否则启动时会出现 `NODE_MODULE_VERSION` 不匹配错误。

必须执行以下命令：

```bash
npm run rebuild
```

该命令实际执行的是：

- `electron-builder install-app-deps`
- 自动下载并编译适配当前 Electron 版本的 SQLite 原生模块

------

## 3. 开发模式启动（Development）

用于日常开发与调试。

```bash
npm start
```

说明：

- 启动前会自动执行 `tsc`（TypeScript → JavaScript）
- 随后启动 Electron 主进程与渲染进程
- **数据库文件 `news.db`**：
  在开发模式下会生成在**项目根目录**，便于直接使用 SQLite 工具查看

------

## 4. 打包发布（Build / Distribution）

当需要生成 Windows 安装包（`.exe`）用于演示或提交作业时，请执行以下步骤。

### 4.1 注意事项（Windows）

打包过程中涉及文件解压和**符号链接创建**操作，
**必须使用管理员权限运行终端**，否则可能出现以下错误：

- `Cannot create symbolic link`
- `EPERM: operation not permitted`

### 4.2 打包命令

```bash
npm run dist
```

### 4.3 执行流程

1. 执行 `npm run build`（编译 TS）
2. 执行 `npm run rebuild`（修复 Native 模块）
3. 执行 `electron-builder` 生成安装包

### 4.4 输出结果

打包完成后，生成文件位于 `release` 目录：

- 安装包：`HGU News Assistant Setup 1.0.0.exe`
- 免安装版本：`release/win-unpacked/`

------

## 5. 常见问题与解决方案（Troubleshooting）

### 5.1 Native 模块版本不匹配

错误示例：

```text
Error: The module 'better_sqlite3.node' was compiled against a different Node.js version
```

原因：

- `better-sqlite3` 编译时使用的 Node 版本与 Electron 不一致

解决方案：

```bash
rm -rf node_modules
npm install
npm run rebuild
```

------

### 5.2 打包时报权限错误

错误示例：

- `EPERM: operation not permitted`
- `Cannot create symbolic link`

原因：

- 未使用管理员权限运行终端

解决方案：

1. 关闭当前终端
2. 右键 PowerShell / CMD
3. 选择 **以管理员身份运行**
4. 重新执行 `npm run dist`

------

### 5.3 界面空白，控制台报错 `exports is not defined`

原因：

- Electron 渲染进程中混用了 CommonJS 与 ES Module

解决方案：

在 `index.html` 中，在引入主脚本之前添加：

```html
<script>
  var exports = {};
</script>
```

------

## 6. npm 命令速查表

| 命令              | 作用         | 说明                                |
| ----------------- | ------------ | ----------------------------------- |
| `npm start`       | 启动开发环境 | 编译 TS 并启动 Electron             |
| `npm run build`   | 编译代码     | 仅执行 `tsc`                        |
| `npm run rebuild` | 修复原生模块 | `electron-builder install-app-deps` |
| `npm run dist`    | 打包发布     | 编译 + 修复依赖 + 生成 exe          |

------



在中国大陆如果没有 VPN，直接运行 npm install 安装 Electron 和相关依赖通常会失败或卡住（尤其是下载 Electron 二进制包和编译 better-sqlite3 时）。

你需要使用 **国内镜像源**（主要是淘宝 NPM 镜像）。最简单、最稳妥的方法是在项目根目录下创建一个配置文件，告诉 npm 去国内服务器下载。

请按照以下步骤操作：

### 第一步：创建 .npmrc 配置文件

在你的项目根目录（也就是 package.json 所在的同一个文件夹）下，**新建一个文件**，命名为 .npmrc（注意前面有个点，没有后缀名）。

将以下内容**完全复制**到这个文件中：

```ABAP
# 1. 淘宝 NPM 镜像源（解决通用包下载慢）
registry=https://registry.npmmirror.com/

# 2. Node.js 头文件下载源（解决原生模块如 better-sqlite3 编译时的头文件下载问题）
disturl=https://npmmirror.com/dist/

# 3. Electron 二进制包镜像（解决 npm install electron 卡死）
electron_mirror=https://npmmirror.com/mirrors/electron/

# 4. Electron Builder 工具链镜像（解决 npm run dist 打包时下载 NSIS/Wine 等工具卡死）
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/

# 5. better-sqlite3 预编译包镜像（尝试直接下载预编译包，避免本地编译失败）
better_sqlite3_binary_host_mirror=https://npmmirror.com/mirrors/better-sqlite3/
```

### 第二步：清理并安装

为了防止之前失败的缓存干扰，建议先清理一下，然后在终端（CMD 或 PowerShell）执行：

1. **删除旧文件**（如果有的话）：

2. 
   删除项目目录下的 node_modules 文件夹。
   删除项目目录下的 package-lock.json 文件。

3. **开始安装**：

   ```bash
   npm install
   ```

4. **执行 Rebuild**（这一步同样会走国内镜像）：

   ```bash
   npm run rebuild
   ```



















