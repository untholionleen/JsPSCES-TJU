# 13.1.0 构建与验收记录

## 构建内容

已生成完整静态站点源代码、EOS 与 IF97 计算模块、交互图表、公式推导专题、附录、Supabase Auth 前端、SQL 安全迁移、邮件模板、管理员初始化脚本、GitHub Actions Pages 工作流、部署/认证/科学验证文档。

## 自动化检查

最后一次执行：

- `npm run check`：通过，检查 app、EOS、IF97、Auth、图表、推导、配置和数据模块的 JavaScript 语法。
- `npm test`：16 / 16 通过，包含科学基准点、VLE/EOS、DOM ID、模块 import 与前端无服务端 secret 检查。
- HTML 结构检查：117 个 JavaScript 字面量 DOM ID 引用全部存在；相对 ES Module import 全部解析成功。
- 安全字符串检查：未发现 `sb_secret_`、`service_role` 或 `SUPABASE_SERVICE_ROLE_KEY` 被写入前端文件。

## Supabase 端

- 项目可用状态已确认。
- 已应用 `secure_thermo_auth_13_1_0` 数据库迁移。
- 复查 Supabase Security Advisor：3 项公开 SECURITY DEFINER 执行权限警告已消除；仅剩 Auth 泄露密码保护未启用的设置提醒。
- 已确认 `thermo_profiles` 与 `thermo_calculation_history` 字段匹配前端 Auth / 历史记录数据结构。

## 尚未完成的真实环境验收

- 尚未连接用户的 GitHub 账户或向仓库推送文件，因此 GitHub Pages 生产 URL 尚未由本次构建实际发布。
- 尚未获得 SMTP 服务商凭据，也不能代替用户在 Dashboard 中输入 SMTP 密码；因此真实邮箱投递、OTP 与密码重置邮件必须在配置 SMTP 后实测。
- 当前执行环境阻止本地 Chromium 对 localhost 的浏览器访问，未完成自动化浏览器端到端点击测试；已完成语法、DOM 引用、模块导入和科学回归测试。建议部署后按 `docs/AUTH.md` 和 `docs/DEPLOYMENT.md` 的验收清单做一次真实浏览器检查。

## 发布状态

**Release Candidate** `13.1.0 / Nv3.1.0`：代码与自动化回归测试已准备好；GitHub Pages 发布和 SMTP 邮件实测是上线前剩余步骤。
