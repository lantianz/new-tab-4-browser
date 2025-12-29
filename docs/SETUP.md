# Chrome Extension 快速开始指南

## 前置要求

- Node.js >= 14
- Chrome >= 88

## 快速开始

```bash
# 1. 复制模板并进入目录
cp -r chrome-plugin-vue3 my-extension && cd my-extension

# 2. 安装依赖
npm install

# 3. 开发模式
npm run dev

# 4. 构建
npm run build

# 4.1 开发构建
npm run bv:dev

# 4.2 构建 + ZIP 打包
npm run bv:zip -- 1.0.0
```

## 加载到 Chrome

1. 访问 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `output/` 目录下你的插件文件夹

## 项目结构

```
├── src/
│   ├── App.vue              # 主页面
│   ├── popup.js             # Popup 入口
│   ├── background.js        # 后台脚本
│   ├── content/index.js     # 内容脚本
│   ├── stores/              # Pinia 状态管理
│   ├── components/common/   # 通用组件 (Toast, CustomSelect)
│   └── utils/common/        # 工具函数
├── manifest.json            # 扩展配置
├── popup.html               # Popup HTML
└── vite.config.js           # Vite 配置
```

## 自定义配置

### 修改扩展信息

编辑 `manifest.json`:
```json
{
  "name": "你的扩展名称",
  "description": "扩展描述",
  "version": "1.0.0"
}
```

### 替换图标

将图标放入 `icons/` 目录:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

## 构建命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式 |
| `npm run build` | 普通构建 |
| `npm run bv -- 1.0.0` | 版本化构建 |
| `npm run bv:zip -- 1.0.0` | 构建 + ZIP 打包 |
| `npm run bv:dev` | 开发构建（固定目录名） |

## 内置组件

### Toast 提示

```javascript
import { showSuccess, showError, showWarning, showInfo } from '@/utils/common/toast'

showSuccess('操作成功!')
showError('操作失败!')
```

### CustomSelect 下拉框

```vue
<CustomSelect v-model="selected" :options="[
  { label: '选项一', value: 'opt1' },
  { label: '选项二', value: 'opt2' }
]" />
```

## 调试

- **Popup**: 右键扩展图标 → 检查弹出内容
- **Background**: 扩展页面点击 Service Worker 链接
- **Content Script**: 目标网页 F12 开发者工具

## 常用权限

| 权限 | 说明 |
|------|------|
| `activeTab` | 访问当前标签页 |
| `storage` | Chrome 存储 API |
| `tabs` | 标签页信息 |
| `scripting` | 脚本注入 |
| `clipboardWrite` | 写入剪贴板 |

## 相关文档

- [Chrome 扩展开发](https://developer.chrome.com/docs/extensions/)
- [Vue 3](https://vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [版本化构建说明](./BUILD_VERSION.md)
