# TJU-ThermoHub v3.0 — Supabase 数据库与 Auth 部署说明

## 1. 项目连接信息

前端当前使用您提供的 Supabase 项目：

- Project URL: `https://xymgvqabrjscsfoojbze.supabase.co`
- Client key: Publishable key（可在浏览器端使用）
- 前端模块：`assets/app.js`

Publishable key 是面向客户端的公开标识，不是数据库密码。**严禁将 `service_role` / secret key、Postgres 密码、SMTP 密码或个人访问令牌写入 HTML、JavaScript、Git 仓库或公开部署环境。** 表数据访问由 PostgreSQL RLS 限制。

## 2. SQL 安装

1. 登录 Supabase Dashboard，选择此项目。
2. 打开 SQL Editor。
3. 在运行前确认这是正确项目，并备份现有数据库结构/数据。
4. 打开 `supabase/schema.sql`，全文复制到 SQL Editor。
5. 先在 SQL Editor 中检查语句，再执行。
6. 执行后到 Table Editor 确认出现 `thermo_` 前缀的新表。脚本不会删除或重建您已有的表；只创建/更新本项目命名空间内对象。
7. 在 Authentication → Users 中注册一个本人控制的账户并完成邮箱确认。
8. 在 SQL Editor 中按第 8 节的脚本把自己的账户升级为管理员。

> 如果您的项目已存在同名 `thermo_*` 表但字段与本脚本不同，请先人工比对 schema，不要盲目执行。SQL 使用增量/幂等写法，但不能替代现有数据库结构审计。

## 3. Supabase Auth 后台设置

### 3.1 启用邮箱登录

Dashboard → Authentication → Sign In / Providers → Email：

- 启用 Email provider。
- 首期建议开启 Confirm email。
- 建议最小密码长度设为 8 位或更高，并按项目要求配置密码复杂度。
- 若启用 CAPTCHA，需要同步在前端加入对应 CAPTCHA token 流程；当前网页未集成 CAPTCHA，因此不要在后台强制开启 CAPTCHA 后期待现有注册表单自动通过。

### 3.2 URL Configuration

Dashboard → Authentication → URL Configuration：

**Site URL** 设置为实际生产站点首页。当前沿用此前网站地址时可设为：

`https://untholionleen.github.io/JsPSCES-TJU/`

**Redirect URLs** 建议逐条加入：

- `http://localhost:8080/**`
- `http://127.0.0.1:8080/**`
- `https://untholionleen.github.io/JsPSCES-TJU/**`
- 您未来正式自定义域名下的站点路径（实际部署后再添加）

注册邮件确认使用当前页面地址作为 `emailRedirectTo`；找回密码使用 `?auth=recovery` 返回本站并显示设置新密码表单。部署地址变动时，必须同步调整允许跳转白名单。

### 3.3 邮件模板

Dashboard → Authentication → Email Templates：

- Confirm signup：使用 `supabase/email-templates/confirm-signup.html`
- Reset password：使用 `supabase/email-templates/reset-password.html`

模板使用 Supabase Auth 邮件变量 `{{ .Email }}` 与 `{{ .ConfirmationURL }}`。不要把实际用户邮箱写死在模板中。

### 3.4 SMTP 配置

生产环境建议配置自己的事务邮件服务：

1. Dashboard → Project Settings / Authentication 的 SMTP Settings（界面名称可能随 Supabase 控制台版本调整）。
2. 填写 SMTP Host、Port、Username、Password、Sender email、Sender name。
3. 发件域名按邮件服务商说明完成 SPF、DKIM，建议配置 DMARC。
4. 先用项目拥有者控制的测试邮箱分别测试注册确认与重置密码。
5. SMTP 密码只填在 Supabase Dashboard 的安全配置表单，不提交给前端、不写入仓库。

我没有您的 SMTP 服务商、发件域名和 SMTP 凭据，因此没有臆造或代填这些信息。未配置 SMTP 时，Supabase 项目默认邮件能力/额度可能不适合正式公开注册，需按当前项目套餐和 Supabase 最新说明核对。

## 4. 账户生命周期

- 注册：`supabase.auth.signUp()`，新账户默认 `student`。
- 邮箱确认：由 Supabase Auth 邮件确认完成。
- 登录：`signInWithPassword()`。
- 找回密码：`resetPasswordForEmail()`，邮件回站后 `updateUser({ password })`。
- 退出：`signOut()`。
- Profile：Auth 用户创建时由数据库触发器写入 `thermo_profiles`。

管理员不由前端邮箱比对决定，必须由数据库角色字段控制。注册用户不能自助提升为 teacher/admin。

## 5. 首次管理员授权

先在网页注册并完成邮箱验证。然后把下面 SQL 中的邮箱换成**您本人确认过的注册邮箱**，在 Supabase SQL Editor 中由项目所有者执行：

```sql
update public.thermo_profiles p
set role = 'admin', updated_at = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('YOUR_CONFIRMED_ADMIN_EMAIL');
```

执行后退出再登录，网页会从 `thermo_profiles.role` 读取角色。不要将管理员邮箱/密码硬编码进 JS。

## 6. 数据与隐私策略

- `thermo_calculation_history`：每位登录用户只能读取/写入自己的计算记录；管理员可审阅。
- 纯物质、EOS 模型、二元参数、VLE 数据等参考主数据：匿名用户可读取符合发布状态的数据；写入仅限 admin。
- 数据库中未审核的种子值保持 `provisional`，不会因插入数据库自动变成已验证数据。
- 前端本地历史仅存当前浏览器 localStorage；云端历史需要登录并成功写入 Supabase。
- SQL 不包含 `service_role` key，也不授权公开用户写入数据库主数据。

## 7. 本地启动

静态网页不能用 `file://` 直接打开 ES module。项目根目录运行：

```bash
python -m http.server 8080
```

访问 `http://localhost:8080`。首次认证需要浏览器联网加载 Supabase JS SDK 并连通 Supabase。核心 EOS / VLE 教学计算在浏览器本地运行，不要求登录。

## 8. 回滚

本脚本不删除既有表，但如果要撤销本项目新增对象，应先导出 `thermo_*` 数据，再由数据库管理员根据依赖关系制定单独回滚脚本。不要在生产环境直接运行 `DROP SCHEMA public CASCADE` 或清空整个项目。
