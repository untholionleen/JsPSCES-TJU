# TJU-ThermoHub 13.1.0

**天津大学化工热力学学生自主学习网站** · Build `Nv3.1.0`

本仓库是可直接部署到 GitHub Pages 的静态网站源码。核心计算在浏览器本地执行；Supabase 仅承担可选的邮箱账户认证与个人计算历史保存，不作为 EOS / IF97 计算的在线依赖。

## 1. 当前交付功能

- **EOS / VLE**：van der Waals、RK、SRK、Peng–Robinson 纯物质立方型状态方程；正实根、压缩因子、摩尔体积、逸度系数、剩余焓/熵及归一化剩余性质估算；二元体系 Wilson K 值 + Rachford–Rice 初步 VLE；P–V 等温线。
- **水和水蒸气**：IAPWS-IF97 Region 1、2、3、4、5 基本方程；饱和压力/温度、饱和液/汽性质、P–T 状态判定、P–h 反算、线性/双线性插值；Region 3 采用密度数值求根。
- **工程图表**：PR 对应态压缩因子估算、干空气定比热理想气体 h–s / T–s 图、CSV 导入制冷剂 P–h 绘图器。
- **P–V–T 曲面**：基于立方型 EOS 生成可拖动旋转的 3D 网格曲面。
- **公式推导**：8 个专题，按步骤展开公式、依据、适用条件和易错点。
- **附录**：物质索引、符号术语、单位换算、数据来源索引。
- **账户**：Supabase 邮箱注册/OTP 验证、密码登录、重置密码、个人计算历史读写；无服务端密钥暴露。
- **部署**：GitHub Actions 自动测试并发布 Pages；本地静态资源缓存，计算不依赖第三方 CDN。

## 2. 本地运行

不要直接双击 `index.html`（ES Modules 在 `file://` 下会受浏览器限制）。在项目根目录运行：

```bash
python -m http.server 8000
```

浏览器打开 `http://localhost:8000/`。

## 3. 测试

Node.js 22 或较新版本：

```bash
npm run check
npm test
```

当前回归测试覆盖 IF97 Region 1/2/3 基准点、饱和压力、饱和边界、P–h 两相与压缩液体反算、插值、PR EOS 和 Wilson VLE。测试通过不等于所有区域、所有物质与所有工程边界已完成全面认证；请查看 `docs/VALIDATION.md`。

## 4. GitHub Pages 部署

1. 将本目录所有文件上传至 GitHub 仓库 `JsPSCES-TJU` 的 `main` 分支根目录。
2. 仓库 Settings → Pages → Build and deployment 选择 **GitHub Actions**。
3. 推送 `main` 后，工作流 `.github/workflows/deploy-pages.yml` 自动运行测试并发布。
4. 目标网址：`https://untholionleen.github.io/JsPSCES-TJU/`。

详细说明见 `docs/DEPLOYMENT.md`。

## 5. Supabase

项目 URL 与 Publishable Key 已写入 `assets/js/config.js`。Publishable Key 是可公开使用的前端 key；**不要**把 Service Role Key、数据库密码或 SMTP 密码放入本仓库。

本次已对项目 `xymgvqabrjscsfoojbze` 应用 `supabase/migrations/20261106113630_secure_thermo_auth_13_1_0.sql` 对应的安全加固：将管理员 RLS helper 移出公开 API schema、撤销三个公开 SECURITY DEFINER 函数的执行权限、保护 profile.role 防止普通用户自我提权、补充显式表权限。原有 `thermo_*` 表和数据未删除。

邮箱 SMTP、URL allowlist、邮件模板与密码泄露保护需要在 Supabase Dashboard 完成，具体见 `docs/AUTH.md`。当前安全顾问剩余一项设置提醒：**Leaked Password Protection 尚未启用**，需要管理员在 Auth 密码安全设置中打开。

## 6. 重要模型边界

- 数据库现有 16 种基础物质的临界常数状态均为 `provisional`。网站如实标注为暂定参数，不作为经审定数据库。
- 二元 VLE 当前为 Wilson K 值与 Rachford–Rice 估算，不是严格的 φ–φ EOS 闪蒸。
- 普遍化 Z 图当前为 PR 对应态估算，不是教材 Lee–Kesler 标准图数字化数据。
- 空气图采用干空气定比热理想气体近似。
- R-134a P–h 图为 CSV 数据绘图器；没有伪造制冷剂曲线。
- 工程图谱的正式数字化数据集、误差带和独立留出验证仍是后续专项工作。

以上边界在 `docs/VALIDATION.md` 中列出。严禁将暂定参数、经验估算或教学近似直接用于工艺设计、安全分析或生产控制。

## 7. 目录

```text
assets/css/                 页面样式
assets/js/app.js            页面交互与模块编排
assets/js/core/eos.js       立方型 EOS 与 Wilson VLE
assets/js/core/if97.js      IAPWS-IF97 基本方程
assets/js/core/auth.js      Supabase Auth / REST
assets/js/modules/          图表与推导内容
supabase/migrations/        数据库安全迁移
supabase/email-templates/   注册与重置密码邮件模板
supabase/bootstrap-admin.sql 首位管理员手动初始化脚本
data/                       数据与验证点
 docs/                      部署、认证、开发顺序与验证说明
tests/                      Node 回归测试
```

## 8. 致谢与引用

- IAPWS：工业公式体系 IF97 与水/水蒸气性质标准发布文件。
- NIST Chemistry WebBook：物质物性数据核验入口。
- CoolProp：独立物性模型交叉核验参考。
- Patrick J. Barrie：立方型状态方程教学程序与算法参考。
- 《化工热力学》第三版：课程理论框架、符号与教学内容参考。
- 本项目由 Untholionleen 发起，开发过程使用 AI 辅助编程与文档整理；不代表天津大学、教材作者或 OpenAI 的官方产品、认证或背书。
