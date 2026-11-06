-- Run manually in Supabase SQL Editor only after the intended administrator has registered and verified email.
-- Replace the email below with the exact verified account address. Never promote a user from client-side metadata.
update public.thermo_profiles
set role = 'admin', updated_at = now()
where lower(email) = lower('REPLACE_WITH_VERIFIED_ADMIN_EMAIL');

-- Confirm exactly one intended row was updated:
select id, email, display_name, role, created_at
from public.thermo_profiles
where lower(email) = lower('REPLACE_WITH_VERIFIED_ADMIN_EMAIL');
