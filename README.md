# 新标签页

## 发布说明

- 远程仓库：`https://github.com/lantianz/new-tab-4-browser.git`
- 开发构建：`npm run bv:dev`
- 发布打包：`npm run bv -- 1.0.1 --zip`
- 自动发布：推送语义化版本 tag，例如 `1.0.1`

## Release 流程

1. 更新根目录 [CHANGELOG.md](D:/Users/Desktop/new-tab-bookmarker/CHANGELOG.md) 中对应版本段
2. 提交代码并推送到默认分支
3. 创建并推送 tag，例如：

```bash
git tag 1.0.1
git push origin 1.0.1
```

4. GitHub Actions 会自动：
   - 校验 `CHANGELOG.md` 中是否存在与 tag 同名的版本段
   - 安装依赖
   - 执行 `bv -- <tag> --zip`
   - 从 `CHANGELOG.md` 提取对应版本说明
   - 自动创建 GitHub Release 并上传 ZIP 包
