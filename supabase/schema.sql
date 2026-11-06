-- TJU-ThermoHub v3.0 | additive Supabase/PostgreSQL schema
-- Run in Supabase SQL Editor after backing up / reviewing your current schema.
-- All new application tables use thermo_* names. No existing tables are dropped.

begin;

create extension if not exists pgcrypto;

-- 1) Profiles are created automatically from Supabase Auth users.
create table if not exists public.thermo_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'student' check (role in ('student','teacher','admin')),
  locale text not null default 'zh-CN',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.thermo_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists thermo_profiles_set_updated_at on public.thermo_profiles;
create trigger thermo_profiles_set_updated_at
before update on public.thermo_profiles
for each row execute function public.thermo_set_updated_at();

create or replace function public.thermo_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.thermo_profiles (id, email, display_name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email,''), '@', 1)),
    'student'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.thermo_profiles.display_name, excluded.display_name);
  return new;
end;
$$;

drop trigger if exists thermo_on_auth_user_created on auth.users;
create trigger thermo_on_auth_user_created
after insert on auth.users
for each row execute function public.thermo_handle_new_auth_user();

-- Backfill profiles for Auth users who existed before this migration.
-- Existing profiles/roles are preserved; newly backfilled users default to student.
insert into public.thermo_profiles (id, email, display_name, role)
select
  u.id,
  lower(u.email),
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(u.email,''), '@', 1)),
  'student'
from auth.users u
on conflict (id) do nothing;

create or replace function public.thermo_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.thermo_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.thermo_is_admin() from public;
grant execute on function public.thermo_is_admin() to authenticated;

-- 2) Source registry and substances.
create table if not exists public.thermo_data_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_name text not null,
  organization text,
  source_url text,
  version_label text,
  access_mode text not null default 'reference_link' check (access_mode in ('reference_link','public_download','api','licensed','local_transcription','manual_entry')),
  license_status text not null default 'review_required' check (license_status in ('open','attribution_required','licensed','restricted','review_required','unknown')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.thermo_substances (
  id uuid primary key default gen_random_uuid(),
  cas_rn text not null unique,
  name_zh text not null,
  name_en text not null,
  formula text,
  molecular_weight_g_mol numeric(16,8),
  tc_k numeric(16,8),
  pc_mpa numeric(16,8),
  zc numeric(12,8),
  acentric_factor numeric(12,8),
  data_status text not null default 'provisional' check (data_status in ('provisional','cross_checked','approved','deprecated')),
  source_id uuid references public.thermo_data_sources(id) on delete set null,
  source_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists thermo_substances_name_zh_idx on public.thermo_substances using gin (to_tsvector('simple', coalesce(name_zh,'')));
create index if not exists thermo_substances_name_en_idx on public.thermo_substances using gin (to_tsvector('english', coalesce(name_en,'')));

drop trigger if exists thermo_substances_set_updated_at on public.thermo_substances;
create trigger thermo_substances_set_updated_at before update on public.thermo_substances
for each row execute function public.thermo_set_updated_at();

create table if not exists public.thermo_property_values (
  id uuid primary key default gen_random_uuid(),
  substance_id uuid not null references public.thermo_substances(id) on delete cascade,
  property_code text not null,
  numeric_value numeric(24,12) not null,
  original_value text,
  unit text not null,
  phase text,
  temperature_min_k numeric(16,8),
  temperature_max_k numeric(16,8),
  pressure_min_mpa numeric(16,8),
  pressure_max_mpa numeric(16,8),
  uncertainty text,
  data_kind text not null default 'reference' check (data_kind in ('experimental','evaluated','correlated','estimated','reference','transcribed')),
  quality_status text not null default 'provisional' check (quality_status in ('provisional','checked','approved','rejected')),
  source_id uuid references public.thermo_data_sources(id) on delete set null,
  source_locator text,
  created_at timestamptz not null default now(),
  unique (substance_id, property_code, unit, source_id, phase)
);
create index if not exists thermo_property_values_substance_property_idx on public.thermo_property_values(substance_id, property_code);

-- 3) EOS definitions and component / binary parameter sets.
create table if not exists public.thermo_eos_models (
  id uuid primary key default gen_random_uuid(),
  model_key text not null unique,
  model_name text not null,
  equation_family text not null,
  formulation_version text not null,
  reference_text text,
  is_enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.thermo_eos_component_parameters (
  id uuid primary key default gen_random_uuid(),
  substance_id uuid not null references public.thermo_substances(id) on delete cascade,
  eos_model_id uuid not null references public.thermo_eos_models(id) on delete cascade,
  parameter_set jsonb not null default '{}'::jsonb,
  temperature_min_k numeric(16,8),
  temperature_max_k numeric(16,8),
  quality_status text not null default 'provisional' check (quality_status in ('provisional','checked','approved','rejected')),
  source_id uuid references public.thermo_data_sources(id) on delete set null,
  source_locator text,
  created_at timestamptz not null default now(),
  unique (substance_id, eos_model_id, source_id)
);

create table if not exists public.thermo_binary_parameters (
  id uuid primary key default gen_random_uuid(),
  component_1_id uuid not null references public.thermo_substances(id) on delete cascade,
  component_2_id uuid not null references public.thermo_substances(id) on delete cascade,
  eos_model_id uuid references public.thermo_eos_models(id) on delete cascade,
  activity_model text,
  parameter_key text not null,
  parameter_value numeric(24,12),
  parameter_set jsonb not null default '{}'::jsonb,
  temperature_min_k numeric(16,8),
  temperature_max_k numeric(16,8),
  quality_status text not null default 'provisional' check (quality_status in ('provisional','fitted','checked','approved','rejected')),
  source_id uuid references public.thermo_data_sources(id) on delete set null,
  source_locator text,
  fit_dataset_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  check (component_1_id <> component_2_id)
);
create index if not exists thermo_binary_parameters_pair_idx on public.thermo_binary_parameters(component_1_id, component_2_id, parameter_key);

-- 4) Experimental phase-equilibrium data and fitted model parameters are separate.
create table if not exists public.thermo_vle_datasets (
  id uuid primary key default gen_random_uuid(),
  dataset_key text unique,
  title text not null,
  system_components uuid[] not null,
  phase_type text not null default 'VLE' check (phase_type in ('VLE','LLE','VLLE','GLE','SLE','GSE')),
  measurement_method text,
  temperature_min_k numeric(16,8),
  temperature_max_k numeric(16,8),
  pressure_min_mpa numeric(16,8),
  pressure_max_mpa numeric(16,8),
  doi text,
  publication_citation text,
  source_id uuid references public.thermo_data_sources(id) on delete set null,
  license_status text not null default 'review_required',
  is_public boolean not null default false,
  quality_status text not null default 'unreviewed' check (quality_status in ('unreviewed','checked','approved','rejected')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.thermo_vle_points (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.thermo_vle_datasets(id) on delete cascade,
  temperature_k numeric(16,8),
  pressure_mpa numeric(16,8),
  liquid_composition numeric[] not null,
  vapor_composition numeric[],
  raw_units jsonb not null default '{}'::jsonb,
  uncertainty jsonb not null default '{}'::jsonb,
  phase_label text,
  created_at timestamptz not null default now()
);
create index if not exists thermo_vle_points_dataset_idx on public.thermo_vle_points(dataset_id);

create table if not exists public.thermo_model_fits (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid references public.thermo_vle_datasets(id) on delete set null,
  model_key text not null,
  parameter_set jsonb not null,
  sample_count integer,
  aad numeric(16,8),
  rmsd numeric(16,8),
  bias numeric(16,8),
  temperature_min_k numeric(16,8),
  temperature_max_k numeric(16,8),
  software_name text,
  software_version text,
  fit_status text not null default 'provisional' check (fit_status in ('provisional','checked','published','rejected')),
  source_id uuid references public.thermo_data_sources(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 5) User-owned calculation records.
create table if not exists public.thermo_calculation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calculation_type text not null,
  model_key text,
  input_data jsonb not null default '{}'::jsonb,
  result_data jsonb not null default '{}'::jsonb,
  source_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists thermo_calculation_history_user_date_idx on public.thermo_calculation_history(user_id, created_at desc);

create table if not exists public.thermo_ingestion_logs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.thermo_data_sources(id) on delete set null,
  task_key text not null,
  status text not null check (status in ('queued','running','succeeded','partial','failed')),
  records_read integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  checksum text,
  error_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- 6) RLS: public read for published reference data; only admin writes master data.
alter table public.thermo_profiles enable row level security;
alter table public.thermo_data_sources enable row level security;
alter table public.thermo_substances enable row level security;
alter table public.thermo_property_values enable row level security;
alter table public.thermo_eos_models enable row level security;
alter table public.thermo_eos_component_parameters enable row level security;
alter table public.thermo_binary_parameters enable row level security;
alter table public.thermo_vle_datasets enable row level security;
alter table public.thermo_vle_points enable row level security;
alter table public.thermo_model_fits enable row level security;
alter table public.thermo_calculation_history enable row level security;
alter table public.thermo_ingestion_logs enable row level security;

-- Profiles: users read their own profile; admins read all. Users may only update safe columns.
drop policy if exists thermo_profiles_select_own_or_admin on public.thermo_profiles;
create policy thermo_profiles_select_own_or_admin on public.thermo_profiles for select to authenticated
using (id = auth.uid() or public.thermo_is_admin());
drop policy if exists thermo_profiles_update_own on public.thermo_profiles;
create policy thermo_profiles_update_own on public.thermo_profiles for update to authenticated
using (id = auth.uid() or public.thermo_is_admin())
with check (id = auth.uid() or public.thermo_is_admin());

-- Public master data read.
drop policy if exists thermo_sources_read_public on public.thermo_data_sources;
create policy thermo_sources_read_public on public.thermo_data_sources for select to anon, authenticated using (true);
drop policy if exists thermo_substances_read_active on public.thermo_substances;
create policy thermo_substances_read_active on public.thermo_substances for select to anon, authenticated using (is_active = true or public.thermo_is_admin());
drop policy if exists thermo_property_values_read_checked on public.thermo_property_values;
create policy thermo_property_values_read_checked on public.thermo_property_values for select to anon, authenticated using (quality_status in ('checked','approved') or public.thermo_is_admin());
drop policy if exists thermo_eos_models_read_enabled on public.thermo_eos_models;
create policy thermo_eos_models_read_enabled on public.thermo_eos_models for select to anon, authenticated using (is_enabled = true or public.thermo_is_admin());
drop policy if exists thermo_eos_parameters_read_checked on public.thermo_eos_component_parameters;
create policy thermo_eos_parameters_read_checked on public.thermo_eos_component_parameters for select to anon, authenticated using (quality_status in ('checked','approved') or public.thermo_is_admin());
drop policy if exists thermo_binary_parameters_read_approved on public.thermo_binary_parameters;
create policy thermo_binary_parameters_read_approved on public.thermo_binary_parameters for select to anon, authenticated using (quality_status = 'approved' or public.thermo_is_admin());
drop policy if exists thermo_vle_datasets_read_public on public.thermo_vle_datasets;
create policy thermo_vle_datasets_read_public on public.thermo_vle_datasets for select to anon, authenticated using ((is_public = true and quality_status in ('checked','approved')) or public.thermo_is_admin());
drop policy if exists thermo_vle_points_read_public on public.thermo_vle_points;
create policy thermo_vle_points_read_public on public.thermo_vle_points for select to anon, authenticated using (
  exists (select 1 from public.thermo_vle_datasets d where d.id = dataset_id and d.is_public = true and d.quality_status in ('checked','approved'))
  or public.thermo_is_admin()
);
drop policy if exists thermo_model_fits_read_published on public.thermo_model_fits;
create policy thermo_model_fits_read_published on public.thermo_model_fits for select to anon, authenticated using (fit_status = 'published' or public.thermo_is_admin());

-- Admin write policies on reference/master data.
do $$
declare t text;
begin
  foreach t in array array['thermo_data_sources','thermo_substances','thermo_property_values','thermo_eos_models','thermo_eos_component_parameters','thermo_binary_parameters','thermo_vle_datasets','thermo_vle_points','thermo_model_fits','thermo_ingestion_logs'] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.thermo_is_admin()) with check (public.thermo_is_admin())', t || '_admin_all', t);
  end loop;
end $$;

-- User history is strictly isolated by auth.uid().
drop policy if exists thermo_history_select_own on public.thermo_calculation_history;
create policy thermo_history_select_own on public.thermo_calculation_history for select to authenticated using (user_id = auth.uid() or public.thermo_is_admin());
drop policy if exists thermo_history_insert_own on public.thermo_calculation_history;
create policy thermo_history_insert_own on public.thermo_calculation_history for insert to authenticated with check (user_id = auth.uid());
drop policy if exists thermo_history_delete_own on public.thermo_calculation_history;
create policy thermo_history_delete_own on public.thermo_calculation_history for delete to authenticated using (user_id = auth.uid() or public.thermo_is_admin());

-- 7) Least-privilege grants. No browser-side service key is required.
revoke all on public.thermo_profiles from anon, authenticated;
grant select on public.thermo_profiles to authenticated;
grant update (display_name, avatar_url, locale) on public.thermo_profiles to authenticated;

grant select on public.thermo_data_sources, public.thermo_substances, public.thermo_property_values,
  public.thermo_eos_models, public.thermo_eos_component_parameters, public.thermo_binary_parameters,
  public.thermo_vle_datasets, public.thermo_vle_points, public.thermo_model_fits to anon, authenticated;

grant insert, select, delete on public.thermo_calculation_history to authenticated;
grant select on public.thermo_ingestion_logs to authenticated;

-- Admin CRUD grants are intentionally paired with the RLS policies above.
-- Non-admin users still cannot write because thermo_is_admin() is false.
grant insert, update, delete on public.thermo_data_sources, public.thermo_substances,
  public.thermo_property_values, public.thermo_eos_models,
  public.thermo_eos_component_parameters, public.thermo_binary_parameters,
  public.thermo_vle_datasets, public.thermo_vle_points, public.thermo_model_fits,
  public.thermo_ingestion_logs to authenticated;

-- 8) Idempotent registry seeds. Existing rows are preserved.
insert into public.thermo_data_sources (source_key,source_name,organization,source_url,version_label,access_mode,license_status,notes) values
 ('textbook_thermo3_appendix','《化工热力学》（第三版）电子版附录','化学工业出版社','https://www.cip.com.cn/','2023 / 附录1-13','local_transcription','review_required','用户提供的课程参考资料；不可未经许可公开再分发整套扫描表格。'),
 ('nist_webbook','NIST Chemistry WebBook SRD 69','National Institute of Standards and Technology','https://webbook.nist.gov/','WebBook','reference_link','attribution_required','以官方物质页面逐项核验；不要臆造通用实时 API。'),
 ('nist_thermoml','NIST ThermoML Archive','NIST Thermodynamics Research Center','https://www.nist.gov/mml/acmd/trc/thermoml/thermoml-archive','Archive','public_download','review_required','实验数据需保留 DOI、原始出版信息与再利用许可。'),
 ('coolprop','CoolProp','CoolProp contributors','https://coolprop.org/','8.0.0','public_download','open','开源软件计算引擎；数据及软件许可按项目说明核验。'),
 ('iapws_if97','IAPWS IF97','International Association for the Properties of Water and Steam','https://www.iapws.org/','IF97 release','reference_link','attribution_required','水和水蒸气性质标准；保留发布版本与适用范围。'),
 ('phasepy','Phasepy','Phasepy contributors','https://phasepy.readthedocs.io/','Current docs','reference_link','open','计算/拟合工具，不等于实验参数数据库。'),
 ('ddbst','Dortmund Data Bank / DDBST','DDBST GmbH','https://www.ddbst.com/ddb.html','Commercial database','licensed','restricted','仅使用获授权的数据和参数。')
on conflict (source_key) do nothing;

insert into public.thermo_eos_models (model_key,model_name,equation_family,formulation_version,reference_text,is_enabled,notes) values
 ('VDW','Van der Waals','cubic','classic','课程经典范德华状态方程',true,'用于教学推导及比较。'),
 ('RK','Redlich-Kwong','cubic','RK-1949','Redlich and Kwong (1949)',true,'温度依赖吸引项。'),
 ('SRK','Soave-Redlich-Kwong','cubic','SRK-1972','Soave (1972)',true,'alpha(T,ω) 版本需记录。'),
 ('PR','Peng-Robinson','cubic','PR-1976','Peng and Robinson (1976)',true,'混合规则及 kij 必须记录来源。'),
 ('PRG','Peng-Robinson-Gasem','cubic','PRG-pending-verification','Gasem et al. (2001)',false,'公式与参数实现独立复核前保持禁用。'),
 ('PRSV','Peng-Robinson-Stryjek-Vera','cubic','PRSV','Stryjek and Vera formulation',false,'单独参数集，不与 PR / PRG 混用。')
on conflict (model_key) do nothing;

-- Seed 16 core substances. Status remains provisional until every value is cross-checked.
insert into public.thermo_substances
 (cas_rn,name_zh,name_en,formula,molecular_weight_g_mol,tc_k,pc_mpa,acentric_factor,data_status,source_id,source_note)
select v.cas,v.zh,v.en,v.formula,v.mw,v.tc,v.pc,v.omega,'provisional',s.id,v.note
from (values
 ('7727-37-9','氮气','Nitrogen','N2',28.0134,126.192,3.3958,0.0372,'国际参考初始值；待 NIST/CoolProp 逐项复核'),
 ('7782-44-7','氧气','Oxygen','O2',31.9988,154.581,5.0430,0.0222,'国际参考初始值；待 NIST/CoolProp 逐项复核'),
 ('1333-74-0','氢气（正常氢参考）','Hydrogen (normal)','H2',2.01588,33.145,1.2964,-0.2190,'需特别核对正常氢/仲氢定义'),
 ('124-38-9','二氧化碳','Carbon dioxide','CO2',44.0095,304.1282,7.3773,0.22394,'国际参考初始值；待 NIST/CoolProp 逐项复核'),
 ('74-82-8','甲烷','Methane','CH4',16.0425,190.56,4.5990,0.0110,'教材附录3参考值；国际值复核待完成'),
 ('74-84-0','乙烷','Ethane','C2H6',30.0690,305.32,4.8720,0.0990,'教材附录3参考值；国际值复核待完成'),
 ('74-98-6','丙烷','Propane','C3H8',44.0956,369.83,4.2480,0.1520,'教材附录3参考值；国际值复核待完成'),
 ('106-97-8','正丁烷','n-Butane','C4H10',58.1222,425.12,3.7960,0.1990,'教材附录3参考值；国际值复核待完成'),
 ('109-66-0','正戊烷','n-Pentane','C5H12',72.1488,469.70,3.3700,0.2490,'教材附录3参考值；国际值复核待完成'),
 ('110-54-3','正己烷','n-Hexane','C6H14',86.1754,507.60,3.0250,0.3050,'教材附录3参考值；国际值复核待完成'),
 ('74-85-1','乙烯','Ethylene','C2H4',28.0532,282.34,5.0410,0.0850,'教材附录3参考值；国际值复核待完成'),
 ('115-07-1','丙烯','Propylene','C3H6',42.0797,364.90,4.6000,0.1420,'教材附录3参考值；国际值复核待完成'),
 ('74-86-2','乙炔','Acetylene','C2H2',26.0373,308.30,6.1380,0.1870,'教材附录3参考值；国际值复核待完成'),
 ('71-43-2','苯','Benzene','C6H6',78.1118,562.05,4.8950,0.2110,'教材附录3参考值；国际值复核待完成'),
 ('108-88-3','甲苯','Toluene','C7H8',92.1405,591.75,4.1080,0.2640,'教材附录3参考值；国际值复核待完成'),
 ('7732-18-5','水','Water','H2O',18.01528,647.096,22.0640,0.3440,'水蒸气正式计算应使用 IAPWS-IF97；此处仅为基础物性参考')
) as v(cas,zh,en,formula,mw,tc,pc,omega,note)
join public.thermo_data_sources s on s.source_key = case when v.cas in ('7727-37-9','7782-44-7','1333-74-0','124-38-9') then 'coolprop' else 'textbook_thermo3_appendix' end
on conflict (cas_rn) do nothing;

commit;

-- OPTIONAL: after a user has registered and confirmed their email, promote only
-- the intended account to admin by replacing the placeholder with the verified
-- email address. Run as project owner in SQL Editor, never expose this SQL publicly.
-- update public.thermo_profiles p set role='admin'
-- from auth.users u where p.id=u.id and lower(u.email)=lower('YOUR_VERIFIED_ADMIN_EMAIL');
