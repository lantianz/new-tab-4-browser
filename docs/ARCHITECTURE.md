# 架构说明

## 目标

本次重构采用「页面装配层 + feature 分层 + shared 服务层」结构，目标是：

- 降低 `App.vue` 的职责，避免继续堆积业务细节
- 将书签栏、搜索区、WebDAV、背景图等能力按领域拆分
- 保持现有功能不回退的前提下，提升可读性和扩展性

## 分层约定

### 1. 页面装配层

文件：`src/App.vue`

职责：

- 组合页面级组件
- 管理跨 feature 的页面流程
- 处理扩展级副作用，例如：
  - WebDAV 刷新
  - Chrome Storage 监听
  - 跳转遮罩后再导航
  - 背景图应用到 `document.body`

### 2. Feature 层

#### `src/features/bookmarks`

职责：

- 顶部书签栏展示
- 书签栏设置抽屉
- WebDAV 配置抽屉
- 跳转遮罩
- 书签主题状态与服务

关键文件：

- `src/features/bookmarks/components/BookmarkBar.vue`
- `src/features/bookmarks/components/BookmarkThemeDrawer.vue`
- `src/features/bookmarks/components/WebDavConfigDrawer.vue`
- `src/features/bookmarks/stores/bookmarkUiStore.js`
- `src/features/bookmarks/services/webdavBookmarkService.js`

#### `src/features/search`

职责：

- 搜索区展示与交互
- 搜索引擎选择
- 搜索联想结果展示
- 背景图文件句柄持久化

关键文件：

- `src/features/search/components/SearchStage.vue`
- `src/features/search/stores/searchUiStore.js`
- `src/features/search/services/backgroundImageService.js`
- `src/features/search/services/searchPageStateService.js`

### 3. Shared 层

职责：

- 跨 feature 复用的常量与基础服务封装

关键文件：

- `src/shared/constants/storageKeys.js`
- `src/shared/services/chromeStorageService.js`
- `src/shared/services/localStorageService.js`

### 4. Utils 层

职责：

- 无状态纯函数
- 不依赖 UI 与存储实现

关键文件：

- `src/utils/bookmark.js`

## 当前状态

已完成：

- 搜索区从 `App.vue` 中拆出为 `SearchStage`
- 书签主题、WebDAV、背景图开始分层到 feature/shared service
- 右上角统一设置入口支持背景图和跳转遮罩配置
- 书签点击改为先显示全屏占位再导航

后续建议：

- 继续把 `App.vue` 中剩余页面级样式进一步按 feature 下沉
- 为 WebDAV 刷新与书签解析补充更细粒度测试
- 如果后续配置项继续增长，可将“页面设置”进一步拆成独立 settings feature
