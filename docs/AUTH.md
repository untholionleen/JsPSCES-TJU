# Supabase 邮箱注册、验证与密码管理配置

## 1. 已接入内容

前端 `assets/js/core/auth.js` 使用 Supabase Auth REST API 与 PostgREST：

- 邮箱 + 密码注册；
- 注册邮箱 6 位 OTP 验证（确认邮件模板需使用 `{{ .Token }}`）；
- 邮箱 + 密码登录；
- 密码重置邮件；
- 登录后更新密码；
- 个人计算历史新增、查询、删除。

当前项目：`xymgvqabrjscsfoojbze`。项目 URL 和 Publishable Key 已在 `assets/js/config.js` 配置。Publishable Key 可出现在浏览器端；前端通过 `apikey` 头发送 Publishable Key，登录后再通过 `Authorization: Bearer <user access token>` 发送用户 JWT。禁止把 Publishable Key 当作用户 JWT，也禁止加入 Service Role Key、数据库密码、SMTP 凭据或任何服务端 secret。

## 2. Supabase Dashboard 必须完成的设置

### A. URL Configuration

Authentication → URL Configuration：

- Site URL：`https://untholionleen.github.io/JsPSCES-TJU/`
- Redirect URLs 添加：
  - `https://untholionleen.github.io/JsPSCES-TJU/`
  - `https://untholionleen.github.io/JsPSCES-TJU/**`
  - 本地测试可临时添加 `http://localhost:8000/**`，正式发布后可移除。

### B. Email Provider

Authentication → Providers → Email：

- 启用 Email provider；
- 开启 Confirm email；
- 密码最小长度建议 8 位以上；
- 限制频率并启用安全密码策略。

### C. 自定义 SMTP

Authentication → SMTP Settings：

1. 启用 Custom SMTP。
2. 填写邮件服务商提供的 SMTP Host、Port、Username、Password、Sender email、Sender name。
3. 推荐按服务商要求使用 587/STARTTLS 或 465/SSL；不要猜测端口和加密方式。
4. 在发件域名 DNS 添加服务商要求的 SPF、DKIM（及可选 DMARC）记录。
5. 发送测试邮件并检查 Gmail/Outlook/学校邮箱的收件、垃圾邮件与验证链接。

**SMTP 凭据不要发到聊天中，也不要写入 `config.js`、HTML 或 GitHub。** 仅在 Supabase Dashboard 的 SMTP 设置中输入。

### D. 邮件模板

Authentication → Email Templates：

- Confirm signup：将 `supabase/email-templates/confirm-signup.html` 内容粘贴到模板。关键变量 `{{ .Token }}` 用于 6 位 OTP。
- Reset password：将 `supabase/email-templates/reset-password.html` 内容粘贴到模板。关键变量 `{{ .ConfirmationURL }}` 用于安全重置链接。
- 邮件主题可分别设为“验证您的 TJU-ThermoHub 账户”和“重置 TJU-ThermoHub 密码”。

如果确认注册模板使用链接而不是 OTP，前端仍支持点击 Supabase 验证链接后返回站点的 access-token 回调；但当前界面优先引导输入 6 位 OTP，建议按模板使用 `.Token`。

### E. 密码泄露保护

当前项目安全顾问检查后，原先 3 项公开 SECURITY DEFINER 警告已清除；剩余 1 项：**Leaked Password Protection Disabled**。

Authentication → Password / Security（Dashboard 具体菜单名称可能随版本变化）启用泄露密码检测。该设置无法通过本项目 SQL 迁移替代。

## 3. 数据库安全迁移

已应用：`supabase/migrations/20261106113630_secure_thermo_auth_13_1_0.sql`。

迁移内容：

- 创建未暴露给 Data API 的 `private` schema；
- 将 RLS 管理员判定函数放入 `private` schema；
- 撤销 `public.thermo_is_admin()`、`public.thermo_handle_new_auth_user()`、`public.rls_auto_enable()` 对 anon/authenticated 的执行权限；
- 增加 profile.role 防自我提权触发器；
- 显式授予必要 Data API 表权限；
- 增加个人计算历史索引。

迁移没有删除、清空现有 `thermo_*` 数据。现有 `thermo_history_insert_own` RLS policy 已存在，限制 `user_id = auth.uid()`。

在 Project Settings → API / Data API 确认 `public` 为暴露 schema；不要暴露 `private`。所有业务表必须保持 RLS 开启。

## 4. 首位管理员设置

1. 先在网站注册一个指定管理员邮箱。
2. 完成邮箱验证并登录。
3. 在 Supabase SQL Editor 打开 `supabase/bootstrap-admin.sql`，把 `REPLACE_WITH_VERIFIED_ADMIN_EMAIL` 替换为该邮箱并执行。
4. 确认查询结果只返回预期账户且 role 为 `admin`。

管理员角色只能由受信任的 Supabase SQL Editor / 后端管理员操作授予；不要在前端传入 `role=admin`，也不要在用户 metadata 中自行判断管理员身份。

## 5. 上线验收

- [ ] 新邮箱注册后收到 6 位验证码。
- [ ] OTP 验证后账户可登录。
- [ ] 未验证邮箱不能绕过确认直接使用账户。
- [ ] 密码错误、重复邮箱和过期 OTP 返回清楚错误。
- [ ] 密码重置邮件能回跳 Pages 并更新密码。
- [ ] 登录后计算历史能新增、查询、删除。
- [ ] 用户 A 无法读取/删除用户 B 的历史记录。
- [ ] 用户不能通过 profile update 把 role 改成 admin。
- [ ] Supabase Security Advisor 不再报告公开 SECURITY DEFINER 函数；泄露密码保护警告已处理。
