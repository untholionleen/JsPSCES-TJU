-- Read-only audit queries for the current thermo_* schema.
-- Run in Supabase SQL Editor when checking a future deployment.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name like 'thermo_%'
order by table_name, ordinal_position;

select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename like 'thermo_%'
order by tablename, policyname;

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname='public' and tablename like 'thermo_%'
order by tablename;
