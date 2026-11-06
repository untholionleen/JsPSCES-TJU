# TJU-ThermoHub v3.0

化工热力学自主学习与计算网站，含静态前端、Supabase 增量 SQL、Auth 邮件模板、可选 IAPWS-IF97 API。

## 文件结构

```text
TJU_ThermoHub_v3.0/
├── index.html
├── assets/
│   ├── app.js
│   ├── core.js
│   ├── data.js
│   └── styles.css
├── supabase/
│   ├── schema.sql
│   └── email-templates/
│       ├── confirm-signup.html
│       └── reset-password.html
├── api/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docs/
└── scripts/test-core.mjs
```

## 运行网站（无安装前端依赖）

要求 Python 3.9+ 或任何静态文件服务器。项目根目录运行：

```bash
python -m http.server 8080
```

浏览器打开 `http://localhost:8080`。请勿双击 `index.html` 用 `file://` 打开，因为 ES module 不允许该方式加载。

## 核心计算测试

需要 Node.js 18+：

```bash
npm run test:core
```

## Supabase

- 项目 URL 和 publishable key 已配置在 `assets/app.js`。
- 先按 `docs/SUPABASE_AUTH_SETUP.md` 审核并执行 `supabase/schema.sql`。
- 配置 Authentication Email Provider、Site URL、Redirect URLs、确认邮件模板与自定义 SMTP。
- 用户注册默认是 student。管理员需由项目所有者手动升级。
- 浏览器只使用 Publishable key；绝不可放入 service_role、数据库密码或 SMTP 密码。

## 可选 IF97 API

需要 Python 3.10+：

```bash
python -m pip install -r api/requirements.txt
uvicorn main:app --app-dir api --host 0.0.0.0 --port 8000
```

API 文档：`http://127.0.0.1:8000/docs`。在网站水蒸气模块的 API 地址填 `http://127.0.0.1:8000`。

GitHub Pages 只能托管前端静态文件；IF97 API 需要单独部署到支持 Python 的服务器，并设置 `CORS_ORIGINS`。当前 CORS 默认包含本地地址与此前使用的 GitHub Pages 域名；正式生产前应改为最小化精确来源列表。

## 当前能力和限制

首版实现纯物质 vdW/RK/SRK/PR、PR 二元组元逸度分析、低压修正拉乌尔泡点/露点、Pitzer 第二维里简式、P-V-T 交互网格、D1-D11 推导、精选教材饱和表节点插值和 Supabase Auth/计算历史。高压 EOS-VLE、Phasepy 服务、全面国际实验数据库同步、PRG/PRSV 和全套 IF97 backward equations 尚未交付，必须以页面的“待接入/待验收”提示为准。

更多细节见 `docs/DATA_SOURCES_AND_LIMITS.md` 与 `docs/SUPABASE_AUTH_SETUP.md`。
