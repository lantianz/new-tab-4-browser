# 新标签页

一个基于 `Vue 3 + Pinia + Element Plus + Vite` 的 Chrome 新标签页扩展，核心能力是：

- 顶部模拟 Chrome 书签栏，支持多级文件夹、溢出折叠、其他书签靠右显示
- 通过 WebDAV 拉取 Chrome 导出的书签 HTML，并做本地缓存
- 保留原新标签页搜索区体验，同时支持书签联想结果
- 支持页面背景图、本地跳转遮罩、书签栏主题色等可视化设置

远程仓库：[`lantianz/new-tab-4-browser`](https://github.com/lantianz/new-tab-4-browser)

## 开发命令

```bash
npm install
npm run dev
npm run build
npm run lint
npm run bv:dev
npm run bv:zip -- 1.0.1
```

## 项目结构

```text
src/
├─ features/
│  ├─ bookmarks/   # 书签栏、WebDAV、主题、跳转遮罩
│  └─ search/      # 搜索区、搜索状态、背景图服务
├─ shared/
│  ├─ constants/   # 全局存储 key 等常量
│  └─ services/    # chrome storage / localStorage 封装
├─ components/     # 通用或跨 feature 组件
├─ stores/         # Pinia 入口
├─ utils/          # 纯函数工具，如书签解析
└─ App.vue         # 页面装配层
```

详细说明见 [docs/ARCHITECTURE.md](D:/Users/Desktop/new-tab-bookmarker/docs/ARCHITECTURE.md)。

## WebDAV 使用

1. 在右上角菜单打开 `WebDAV 配置`
2. 填入地址、账号、应用密码、书签文件路径
3. 点击 `保存` 后会自动刷新一次书签
4. 可选开启自动同步，并设置同步频率

## 发布流程

1. 更新 [CHANGELOG.md](D:/Users/Desktop/new-tab-bookmarker/CHANGELOG.md)
2. 执行 `npm run bv:zip -- 1.0.1`
3. 提交并推送代码
4. 推送语义化 tag，例如：

```bash
git tag 1.0.1
git push origin 1.0.1
```

5. GitHub Actions 会自动：
   - 校验 `CHANGELOG.md` 中的对应版本段
   - 安装依赖并执行 `bv:zip`
   - 自动创建 Release 并上传 ZIP 包
