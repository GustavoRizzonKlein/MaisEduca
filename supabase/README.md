# Supabase access control

Apply migrations with the Supabase CLI (`supabase db push`) or run them in order
in the Supabase SQL Editor. The RBAC migration assumes the existing `profiles`,
`turmas`, `alunos`, `professor_turmas`, `professor_apoio_alunos`, and
`responsavel_alunos` tables used by the app's services.

Deploy the updated `manage-users` Edge Function after applying the migration
(`supabase functions deploy manage-users`). The existing
`create_managed_auth_user` RPC must continue creating both the Auth user and a
`profiles` row with the same Auth UUID and server-managed `app_metadata.role`.

The authenticated user's Supabase Auth UUID is the `profiles.id` and association
key. Authorization roles come from server-managed `auth.users.app_metadata.role`;
the migration also updates existing `professor_apoio` role values to `apoio`.
Only the `manage-users` Edge Function should use the service-role key.

The current agenda is held in the app's in-memory `AgendaProvider`; there is no
agenda table to protect with RLS yet. Keep its data non-sensitive until agenda
records are persisted in Supabase, then add row-level policies for those tables
before enabling remote writes.
