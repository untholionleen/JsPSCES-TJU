# TJU-ThermoHub v3.0 交付前检查记录

检查日期：2026-11-06

## 已完成的静态与算法检查

- `node --check assets/app.js`：通过。
- `node --check assets/core.js`：通过。
- `node --check assets/data.js`：通过。
- `npm run test:core`：7/7 核心数值测试通过；另有 3 项集成检查通过（纯物质 PR、修正拉乌尔露点、PR 二元组元逸度）。
- `python -m py_compile api/main.py`：通过。
- HTML / JavaScript 元素引用检查：106 个 HTML id；80 个 JavaScript 字面 id 引用；未发现缺失 id 或重复 id。
- FastAPI TestClient：`/api/health` 返回 200。

## 当前环境限制

- 当前执行环境未预装 CoolProp，且无法从 PyPI 下载依赖。因此 `/api/steam/if97` 在本机检查中按设计返回 503 和明确的缺依赖提示；安装 `api/requirements.txt` 后才能验证真实 IF97 数值。程序没有回退到普通水 EOS，也没有伪造 IF97 结果。
- 未登录用户无法访问您的 Supabase Dashboard；我没有也不能在此处替您执行 `supabase/schema.sql`、配置 SMTP、发确认邮件或创建真实用户。
- 当前工具环境的浏览器回环访问被管理策略阻止，未完成端到端浏览器自动化；代码语法、核心计算、HTML 元素引用和 API 路由已做独立检查。

## 上线前必须完成

1. 在正确的 Supabase 项目中审核并运行 `supabase/schema.sql`。
2. 按 `docs/SUPABASE_AUTH_SETUP.md` 配置 Email Provider、Confirm Email、Site URL、Redirect URLs 和邮件模板。
3. 生产环境配置自有 SMTP，并以实际测试邮箱验证确认邮件和密码重置邮件。
4. 部署 IF97 API，安装 CoolProp，并将 `CORS_ORIGINS` 设置为实际前端域名。
5. 注册本人账户、确认邮箱，再由项目所有者手动授予 admin。
6. 上线前补做浏览器端注册、登录、邮箱确认、重置密码、云端历史读写测试。

## 不应宣称为已完成的能力

国际数据源链接和数据库表结构已建立，但 NIST / ThermoML 批量自动导入、DDBST 授权数据、Phasepy 高压 VLE 服务、完整 16 物质交互参数库、全套 IF97 backward equations、教材完整表格数字化和全站英文化仍需后续开发与授权核验。
