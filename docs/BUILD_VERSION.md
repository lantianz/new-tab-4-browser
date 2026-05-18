# 版本化构建使用说明

## 📖 概述

本项目支持自动化的版本号管理和构建流程，可以通过一条命令完成版本号更新、项目构建和输出打包。

当前构建策略已经调整为：

- 普通构建输出目录固定为 `output/new-tab-bookmarker`
- ZIP 文件名保留版本号，例如 `output/new-tab-bookmarker_v1.0.1.zip`
- ZIP 解压后的根目录固定为 `new-tab-bookmarker`
- 构建产物目录内会写入一个无后缀版本标记文件 `VERSION`

这样做的目的是让 Chrome 扩展在本地反复安装时保持目录稳定，尽量复用同一个插件实例对应的本地存储。

## 🚀 快速开始

### 方案一: 交互式版本化构建（推荐）

直接执行命令，脚本会提示输入版本号：

```bash
npm run bv
```

**交互提示：**

```text
🚀 开始版本化构建流程

请输入版本号 (当前版本: 1.0.3，直接回车使用当前版本):
```

- 输入新版本号（如 `1.0.4`）后按回车
- 或直接按回车使用当前版本号

### 方案二: 指定版本号构建

构建并生成固定目录：

```bash
npm run bv -- 1.0.1
```

**执行流程：**

1. ✅ 自动更新 `package.json` 中的版本号
2. ✅ 自动更新 `manifest.json` 中的版本号
3. ✅ 执行 Vite 构建
4. ✅ 将构建结果移动到 `output/new-tab-bookmarker`
5. ✅ 在目录内写入版本标记文件 `VERSION`

**输出结果：**

```text
output/
└── new-tab-bookmarker/
    ├── VERSION
    ├── manifest.json
    ├── newtab.html
    ├── newtab.js
    ├── background.js
    ├── icons/
    ├── newtab.css
    ├── vue-vendor.js
    └── request-vendor.js
```

`VERSION` 文件内容示例：

```text
1.0.1
```

### 方案三: 版本化构建 + ZIP 打包

构建并生成 ZIP 压缩包：

```bash
npm run bv:zip -- 1.0.1
# 或交互式
npm run bv:zip
```

**执行流程：**

1. ✅ 自动更新版本号
2. ✅ 执行 Vite 构建
3. ✅ 在待压缩目录内写入 `VERSION`
4. ✅ 创建 `output/new-tab-bookmarker_v1.0.1.zip` 压缩包

**输出结果：**

```text
output/
└── new-tab-bookmarker_v1.0.1.zip
```

**解压结果：**

```text
new-tab-bookmarker/
├── VERSION
├── manifest.json
├── newtab.html
└── ...
```

## 📝 命令格式

### 基础构建命令

```bash
# 交互式（推荐）
npm run bv

# 指定版本号（最简洁）
npm run bv -- 1.0.1

# 兼容旧格式
npm run bv -- --1.0.1
npm run bv -- -v 1.0.1
```

### ZIP 打包命令

```bash
# 交互式 + ZIP
npm run bv:zip

# 指定版本号 + ZIP
npm run bv:zip -- 1.0.1

# 也可以使用 --zip 参数
npm run bv -- 1.0.1 --zip
npm run bv -- --zip
```

### 开发模式构建

```bash
# 开发模式 - 输出固定名称 new-tab-bookmarker_dev
npm run bv:dev
```

开发模式除了输出固定目录，还会自动给 `manifest.json` 增加开发版标识：

- `name` 自动追加 ` [DEV]`
- `version_name` 自动写成 `<当前正式版本>-dev`

例如当前正式版本是 `1.0.3`，则开发包在浏览器中会显示为：

- 名称：`新标签页 [DEV]`
- 显示版本：`1.0.3-dev`

## 🔧 版本号规则

版本号必须符合**语义化版本**格式：`major.minor.patch`

### 有效的版本号示例

- ✅ `1.0.0`
- ✅ `1.0.1`
- ✅ `2.3.5`
- ✅ `10.20.30`

### 无效的版本号示例

- ❌ `1.0`（缺少 patch 版本）
- ❌ `v1.0.1`（不能包含 `v` 前缀）
- ❌ `1.0.1-beta`（不支持预发布标签）

## 📦 安装依赖

如果使用 ZIP 打包功能，需要先安装依赖：

```bash
npm install
```

这会自动安装 `archiver` 包（用于创建 ZIP 压缩包）。

## 🎯 使用场景

### 场景 1: 日常开发构建

```bash
npm run bv:dev
```

适合开发测试，快速构建到固定目录。

同时会自动给扩展名称和显示版本追加开发标识，避免和正式安装版混淆。

### 场景 2: 本地安装扩展

```bash
npm run bv -- 1.0.1
```

适合在本地反复加载已解压扩展。目录名固定为 `output/new-tab-bookmarker`，避免因为目录名变化而被 Chrome 识别成新的插件目录。

### 场景 3: 发布版本

```bash
npm run bv:zip -- 1.0.1
```

适合正式发布，自动生成带版本号的 ZIP 压缩包便于分发；解压后的根目录保持固定名称。

## 📋 构建输出说明

### 自动更新的文件

- `package.json` - npm 包版本号
- `manifest.json` - Chrome 扩展版本号

### 自动生成的版本标记

- `output/new-tab-bookmarker/VERSION`
- ZIP 解压后的 `new-tab-bookmarker/VERSION`

### 输出目录结构

```text
项目根目录/
└── output/
    ├── new-tab-bookmarker/              # 固定构建输出目录
    │   ├── VERSION                      # 当前构建版本号，例如 1.0.1
    │   ├── manifest.json
    │   ├── newtab.html
    │   ├── newtab.js
    │   ├── background.js
    │   ├── icons/
    │   ├── newtab.css
    │   ├── vue-vendor.js
    │   └── request-vendor.js
    └── new-tab-bookmarker_v1.0.1.zip    # ZIP 压缩包（可选）
```

## ⚠️ 注意事项

1. **版本号会永久更新**：构建脚本会直接修改 `package.json` 和 `manifest.json` 中的版本号，请确保版本号正确。

2. **目录覆盖**：普通版本化构建会始终覆盖 `output/new-tab-bookmarker`。如果你想保留历史产物，请额外复制备份，或直接使用 ZIP 文件归档。

3. **版本识别方式已调整**：普通构建目录不再通过目录名区分版本，请通过 `VERSION` 文件或 `manifest.json` 中的版本号识别当前构建版本。

4. **Git 提交**：版本号更新后，建议提交到 Git：

```bash
git add package.json manifest.json
git commit -m "chore: bump version to 1.0.1"
git tag 1.0.1
```

5. **兼容性**：保持与原有 `npm run build` 命令的兼容性，如果只需要普通构建，仍可使用：

```bash
npm run build
```

## 🔍 故障排查

### 问题 1: 提示“版本号格式无效”

**原因**：版本号不符合 `x.y.z` 格式。  
**解决**：使用正确的语义化版本号，例如 `1.0.1`。交互模式下会要求重新输入。

### 问题 2: ZIP 打包失败

**原因**：缺少 `archiver` 依赖。  
**解决**：运行 `npm install` 安装依赖。

### 问题 3: 传参版本号不生效

**原因**：命令格式不正确。  
**解决**：确保使用 `--` 分隔符，例如：

```bash
npm run bv -- 1.0.1
```

### 问题 4: 本地加载扩展后版本判断不清晰

**原因**：输出目录名固定，不再直接体现版本号。  
**解决**：查看 `output/new-tab-bookmarker/VERSION` 或 `manifest.json` 中的 `version` 字段。

## 💡 技术实现

### 核心脚本

- `scripts/build-with-version.js` - 统一的版本化构建脚本（支持 `--zip` 参数）

### 工作流程

```text
命令行参数解析
    ↓
交互式版本号输入（如无命令行参数）
    ↓
版本号验证
    ↓
更新 package.json
    ↓
更新 manifest.json
    ↓
执行 vite build
    ↓
普通模式：移动构建结果到 output/new-tab-bookmarker
    ↓
写入 VERSION 文件
    ↓
创建 ZIP（如果指定了 --zip 参数，ZIP 文件名带版本号）
    ↓
完成
```

## 📚 相关文档

- [Vite 配置文档](../vite.config.js)
- [项目设置说明](./SETUP.md)
- [Chrome 扩展开发文档](https://developer.chrome.com/docs/extensions/)
