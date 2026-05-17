# 版本化构建使用说明

## 📖 概述

本项目支持自动化的版本号管理和构建流程,可以通过一条命令完成版本号更新、项目构建和输出打包。

## 🚀 快速开始

### 方案一: 交互式版本化构建(推荐)

直接执行命令，脚本会提示输入版本号:

```bash
npm run bv
```

**交互提示:**

```
🚀 开始版本化构建流程

请输入版本号 (当前版本: 1.0.3，直接回车使用当前版本):
```

- 输入新版本号（如 `1.0.4`）后按回车
- 或直接按回车使用当前版本号

### 方案二: 指定版本号构建

构建并生成带版本号的目录:

```bash
npm run bv -- 1.0.1
```

**执行流程:**

1. ✅ 自动更新 `package.json` 中的版本号
2. ✅ 自动更新 `manifest.json` 中的版本号
3. ✅ 执行 Vite 构建
4. ✅ 将构建结果移动到 `output/new-tab-bookmarker_v1.0.1`

**输出结果:**

```
output/
└── new-tab-bookmarker_v1.0.1/
    ├── manifest.json
    ├── popup.html
    ├── popup.js
    ├── background.js
    ├── content.js
    ├── icons/
    └── assets/
```

### 方案三: 版本化构建 + ZIP 打包

构建并生成 ZIP 压缩包:

```bash
npm run bv:zip -- 1.0.1
# 或交互式
npm run bv:zip
```

**执行流程:**

1. ✅ 自动更新版本号
2. ✅ 执行 Vite 构建
3. ✅ 创建 `output/new-tab-bookmarker_v1.0.1.zip` 压缩包

**输出结果:**

```
output/
└── new-tab-bookmarker_v1.0.1.zip       # ZIP 压缩包
```

## 📝 命令格式

### 基础构建命令

```bash
# 交互式(推荐)
npm run bv

# 指定版本号(最简洁)
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

## 🔧 版本号规则

版本号必须符合**语义化版本**格式: `major.minor.patch`

### 有效的版本号示例:

- ✅ `1.0.0`
- ✅ `1.0.1`
- ✅ `2.3.5`
- ✅ `10.20.30`

### 无效的版本号示例:

- ❌ `1.0` (缺少 patch 版本)
- ❌ `v1.0.1` (不能包含 'v' 前缀)
- ❌ `1.0.1-beta` (不支持预发布标签)

## 📦 安装依赖

如果使用 ZIP 打包功能,需要先安装依赖:

```bash
npm install
```

这会自动安装 `archiver` 包(用于创建 ZIP 压缩包)。

## 🎯 使用场景

### 场景 1: 日常开发构建

```bash
npm run bv:dev
```

适合开发测试,快速构建到固定目录。

### 场景 2: 发布版本

```bash
npm run bv:zip -- 1.0.1
```

适合正式发布,自动生成 ZIP 压缩包便于分发。输出位于 `output/` 目录下。

### 场景 3: 快速迭代

```bash
# 版本 1.0.1
npm run bv -- 1.0.1

# 版本 1.0.2
npm run bv -- 1.0.2

# 版本 1.0.3
npm run bv -- 1.0.3
```

每次构建都会生成独立的版本目录，便于版本管理和回溯。

## 📋 构建输出说明

### 自动更新的文件

- `package.json` - npm 包版本号
- `manifest.json` - Chrome 扩展版本号

### 输出目录结构

```
项目根目录/
└── output/
    ├── new-tab-bookmarker_v1.0.1/        # 构建输出目录
    │   ├── manifest.json      # 版本号已更新为 1.0.1
    │   ├── popup.html
    │   ├── popup.js
    │   ├── background.js
    │   ├── content.js
    │   ├── icons/
    │   └── assets/
    └── new-tab-bookmarker_v1.0.1.zip     # ZIP 压缩包(可选)
```

## ⚠️ 注意事项

1. **版本号会永久更新**: 构建脚本会直接修改 `package.json` 和 `manifest.json` 中的版本号,请确保版本号正确。

2. **目录覆盖**: 如果目标目录已存在,会先删除旧目录再创建新目录。

3. **Git 提交**: 版本号更新后,建议提交到 Git:

   ```bash
   git add package.json manifest.json
   git commit -m "chore: bump version to 1.0.1"
   git tag v1.0.1
   ```

4. **兼容性**: 保持与原有 `npm run build` 命令的兼容性,如果只需要普通构建,仍可使用:
   ```bash
   npm run build
   ```

## 🔍 故障排查

### 问题 1: 提示"版本号格式无效"

**原因**: 版本号不符合 `x.y.z` 格式
**解决**: 使用正确的语义化版本号,例如 `1.0.1`。交互模式下会要求重新输入。

### 问题 2: ZIP 打包失败

**原因**: 缺少 `archiver` 依赖
**解决**: 运行 `npm install` 安装依赖

### 问题 3: 传参版本号不生效

**原因**: 命令格式不正确
**解决**: 确保使用 `--` 分隔符,例如:

```bash
npm run bv -- 1.0.1
```

## 💡 技术实现

### 核心脚本

- `scripts/build-with-version.js` - 统一的版本化构建脚本（支持 `--zip` 参数）

### 工作流程

```
命令行参数解析
    ↓
交互式版本号输入(如无命令行参数)
    ↓
版本号验证
    ↓
更新 package.json
    ↓
更新 manifest.json
    ↓
执行 vite build
    ↓
移动构建结果到 output/new-tab-bookmarker_v{version}
    ↓
创建 ZIP(如果指定了 --zip 参数)
    ↓
完成
```

## 📚 相关文档

- [Vite 配置文档](../vite.config.js)
- [项目设置说明](./SETUP.md)
- [Chrome 扩展开发文档](https://developer.chrome.com/docs/extensions/)
