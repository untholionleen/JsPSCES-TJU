# 天津大学化工热力学学生自主学习网站

**TJU-ThermoHub · 13.1.0 · Nv3.1.0**

这是一次独立于既有 `main` 的新版基线提交。目标是提供统一的中文学术风格入口，将状态方程、工程图表、公式推导、水和水蒸气性质与附录组织在同一站点。

## 当前分支交付内容

- 单文件离线站点：`index.html`（样式和交互脚本内嵌，不依赖 CDN）。
- 4 个学习模块和 1 个附录页：状态方程与模型、工程图表与关联、公式推导、水和水蒸气、附录。
- 立方型 EOS：vdW、RK、SRK、PR 的纯物质计算基础。
- IF97 Region 4 饱和压力/温度关系与用户数据双线性插值教学。
- GitHub Pages Actions 工作流：`.github/workflows/pages.yml`。
- 工作流会在 PR 中检查 HTML 页面结构、无线上 Supabase 客户端/连接以及内嵌 JavaScript 语法；仅在合入 `main` 后执行发布任务。

## 重要的科学与工程边界

这是 **13.1.0 基线版本，不应被描述为全部设计模块均已完成**。

- 当前 VLE 数值求解未启用；需完成混合规则、组分逸度相等、闪蒸衡算与参考数据验证。
- PRG 定义在已审阅资料中不足以独立复现，因此未启用。
- 模块二目前给出 PR EOS 计算的压缩因子曲线，不是 Lee–Kesler 普遍化图，也不实现 (Z_c\ne0.27) 修正、剩余焓/熵关联、空气图或 R-134a log p-h 图。
- 水/蒸汽目前仅包括 IF97 Region 4 饱和曲线和插值教学；Region 1/2/3/5 的 (h,s,u,c_p,c_v) 等完整性质计算仍待移植与验证。
- 推导专题目前只有 D1 范德华临界参数的完整步骤；D2–D11 仍为待补全目录。
- EOS 输出是模型计算结果，不等同于 NIST/REFPROP 高精度物性值；临界参数包含待复核来源标签。

未完成的计算不会用随机数、占位值或伪造数据代替。

## 部署到 GitHub Pages

1. 合并本 PR 至 `main`。工作流在 PR 阶段执行检查，合入 `main` 后才执行部署任务。
2. 在 GitHub 仓库打开 **Settings → Pages → Build and deployment**，将 **Source** 设为 **GitHub Actions**。
3. 查看 **Actions → Deploy TJU-ThermoHub to GitHub Pages**。成功后在 Pages 页面查看站点 URL。
4. 若仓库当前 Pages 仍使用旧的 branch-based publishing source，必须先切换为 **GitHub Actions**，否则自定义部署工作流可能无法发布。

GitHub 官方部署说明：<https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages>

## 本期部署约束

- 不引入 Supabase SDK、项目 URL、anon key、登录、OTP 或云端数据运行时。
- 不创建或执行 SQL 数据库脚本；云端数据主题只保留在未来阶段规划。
- 发布前请先完成 PR 检查，并在浏览器端对桌面与移动端进行人工验收。
- 项目入口：`index.html`。
