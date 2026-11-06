# 本次开发资产与复用说明

- UI 以用户提供的 Ver10.1.0 页面布局为参考，重新组织为模块化静态单页站点。
- EOS/VLE 参考用户提供的 testing_5(BEST) 版的教学结构和原有物质选择范围；当前 16 组临界常数从 Supabase `thermo_substances` 表读取后固化为本地 JSON 镜像，并保留 provisional 标记。
- 用户提供的 4.1.0 页面包含旧 Supabase URL、旧 JWT anon key 和旧 Auth 实现。本次没有把旧 key 或旧项目地址迁入新站；新站仅使用用户当前给出的新项目 URL 与 Publishable Key。
- 本项目运行时不加载第三方 CDN，不依赖在线字体/图表库；所有核心模块为本地 ES Modules。
- 当前并未把旧站 `pjb10.user.srcf.net` 的所有模型、物性数据库、原始算法与全部 Info 文本完整移植进来；后续需要逐项确认数据、模型、符号与来源后再扩展。
