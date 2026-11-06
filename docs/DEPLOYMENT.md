# GitHub Pages 部署手册

## 1. 上传仓库

将整个项目目录的**内容**上传到目标 GitHub 仓库 `JsPSCES-TJU` 的 `main` 分支根目录。根目录应直接看到 `index.html`、`assets/`、`.github/`、`package.json`，不要再套一层同名目录。

## 2. 启用 Pages

1. GitHub 仓库 → Settings → Pages。
2. Build and deployment → Source 选择 **GitHub Actions**。
3. 推送到 `main` 或在 Actions 页面手动运行 `Deploy TJU-ThermoHub to GitHub Pages`。
4. 工作流先执行 `npm run check` 与 `npm test`，通过后才发布。
5. 成功后访问：`https://untholionleen.github.io/JsPSCES-TJU/`。

## 3. 路径与资源

- 所有 CSS、JS、manifest、Service Worker 使用相对路径，适配 `/<repo>/` 子路径。
- 项目使用 hash 导航（`#home`、`#eos` 等），避免 GitHub Pages 子路径 SPA 路由 404。
- 不依赖第三方字体、图表 CDN 或在线数学库；本地计算可离线执行。
- Supabase Auth / Data API 需要联网；网络不可用时不影响本地计算。

## 4. 更新与缓存

- 更新代码后推送 `main`，等待 Actions 成功。
- Service Worker 缓存名当前为 `tju-thermohub-13.1.0`。下一次发布若修改核心资源，应同步提升 `sw.js` 缓存名，避免旧缓存长期保留。
- 若浏览器显示旧版本：先硬刷新；再到 DevTools → Application → Service Workers 注销旧 worker，并清理该站点缓存。

## 5. 本地预览

```bash
python -m http.server 8000
```

打开 `http://localhost:8000/`。不要直接双击 HTML 文件。

## 6. 常见问题

| 现象 | 检查方法 |
|---|---|
| Pages 404 | 确认 `index.html` 位于仓库根目录；Pages Source 为 GitHub Actions；检查 Actions 是否成功 |
| 页面样式缺失 | 检查 `assets/css/styles.css` 路径和文件名大小写 |
| 模块 JS 404 | 检查 `assets/js/` 相对路径，不要改成根路径 `/assets/...` |
| 页面显示旧版本 | 硬刷新并清理 Service Worker 缓存；升级缓存名 |
| 登录回跳失败 | 检查 Supabase Site URL 与 Redirect URLs 是否包含完整 Pages 子路径 |
| 邮件收不到 | 检查 SMTP、发件域名 SPF/DKIM、垃圾邮件、邮件模板和 Auth 限流 |
| 计算正常但云端历史失败 | 检查 Supabase API 暴露 schema、表权限、RLS 与用户登录状态 |
| 图表空白 | 检查输入是否在模型范围内；工程制冷剂图需先导入符合字段要求的 CSV |

## 7. 回滚

发布前创建 tag，例如 `v13.1.0-rc1`。如新版本引入故障，可在 GitHub Releases / Tags 中恢复到最近通过测试的提交，再重新触发 Pages 工作流。
