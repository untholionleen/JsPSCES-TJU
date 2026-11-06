# Supabase 13.1.0

## Existing project

The target project already contains the `thermo_*` tables. This package therefore ships an **adaptation/security migration**, not a destructive database reset or duplicate bootstrap schema.

- Applied migration: `migrations/20261106113630_secure_thermo_auth_13_1_0.sql`
- Admin bootstrap (manual): `bootstrap-admin.sql`
- Confirmation email template: `email-templates/confirm-signup.html`
- Password reset email template: `email-templates/reset-password.html`

## Apply status

The security migration was successfully applied to project `xymgvqabrjscsfoojbze`. The Supabase security advisor was re-run: public/anon and authenticated execution warnings for the three old public SECURITY DEFINER functions no longer appear. The only remaining warning is leaked-password protection, which must be enabled in the Dashboard.

## Important

This migration depends on the current schema objects (`thermo_profiles`, `thermo_calculation_history`, `thermo_substances`, etc.). It is not a fresh-install schema. Do not run it on an empty Supabase project without first applying a separately reviewed base schema migration.
