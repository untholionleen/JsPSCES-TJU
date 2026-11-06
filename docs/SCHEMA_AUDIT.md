# Supabase 现有数据库适配记录

项目：`xymgvqabrjscsfoojbze`

开发前检查发现数据库已存在以下 `public.thermo_*` 表，因此本版本没有重新创建或清空同名表：

- `thermo_profiles`
- `thermo_calculation_history`
- `thermo_data_sources`
- `thermo_substances`
- `thermo_eos_models`
- `thermo_eos_component_parameters`
- `thermo_binary_parameters`
- `thermo_property_values`
- `thermo_vle_datasets`
- `thermo_vle_points`
- `thermo_model_fits`
- `thermo_ingestion_logs`

网站当前使用：

- `thermo_profiles`：Auth 用户资料，主键与 `auth.users.id` 一致；`role` 默认 `student`。
- `thermo_calculation_history`：个人计算历史，列包含 `user_id`、`calculation_type`、`model_key`、`input_data`、`result_data`、`source_info`、`created_at`。
- `thermo_substances`：物质参数；当前 16 条基础物质数据均为 provisional。
- 其他物性、EOS、二元参数和 VLE 数据表保留为数据层，须按质量状态与 RLS 决定是否公开。

已检查 `thermo_history_insert_own` policy 存在，且 `WITH CHECK (user_id = auth.uid())`。`thermo_profiles` 通过 `thermo_on_auth_user_created` 触发器在注册后建立资料，角色固定为 `student`。

本版本仅应用安全加固迁移，迁移历史为 `secure_thermo_auth_13_1_0`。安全顾问复查后，3 项公开 SECURITY DEFINER 函数执行警告已清除；剩余的唯一警告是 Auth 泄露密码保护尚未启用。

如果未来新建一个空 Supabase 项目，应先重新生成并审核完整基础 schema 与数据导入迁移；不要仅执行本安全迁移，因为它依赖上述既有表。
