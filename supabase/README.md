# Supabase access control

Apply migrations with the Supabase CLI (`supabase db push`) or run them in order
in the Supabase SQL Editor. The RBAC migration assumes the existing `profiles`,
`turmas`, `alunos`, `professor_turmas`, `professor_apoio_alunos`, and
`responsavel_alunos` tables used by the app's services.

The student/responsible migration requires every existing student to already
have exactly one row in `responsavel_alunos`. Before applying it, resolve any
students without a responsible and any students linked to multiple responsible
profiles; the migration fails explicitly rather than changing existing links.
New student creation and responsible reassignment use the
`create_aluno_with_responsavel`, `update_aluno_with_responsavel`, and
`set_responsavel_alunos` RPCs. Direct authenticated inserts into `alunos` are
blocked, and deferred database constraints prevent removing a student's last
responsible association.

Deploy the updated `manage-users` Edge Function after applying the migration
(`supabase functions deploy manage-users`). The existing
`create_managed_auth_user` RPC must continue creating both the Auth user and a
`profiles` row with the same Auth UUID and server-managed `app_metadata.role`.
The user-management function also prevents changing or deleting a responsible
profile while that profile still has students; transfer the students first.

The authenticated user's Supabase Auth UUID is the `profiles.id` and association
key. Authorization roles come from server-managed `auth.users.app_metadata.role`;
the migration also updates existing `professor_apoio` role values to `apoio`.
Only the `manage-users` Edge Function should use the service-role key.

## Presença, registros e agenda (20261007100000)

The `20261007100000_presencas_registros_agenda.sql` migration adds the data
used by the Painel de Desempenho:

- `presencas`: one attendance row per student per day (`presente` / `ausente`),
  enforced by a unique `(aluno_id, data)` constraint; the app upserts.
- `registros`: qualitative follow-up notes with a fixed category
  (`avanco`, `dificuldade`, `atividade`, `participacao`).
- `agenda_itens`: the agenda that previously lived only in app memory.

All three reuse `can_access_student()` for reads, so each profile sees exactly the
students it already sees in `alunos`. Writes require Direção, Professor or
Professor de Apoio **and** access to the student (`can_write_student_data()`).
Notes can only be edited/deleted by their author or by Direção. `criado_por`,
`created_at` and `updated_at` are set by a trigger, never by the client.

The panel reads two `SECURITY INVOKER` functions, so RLS still applies:
`desempenho_por_aluno(inicio, fim, turma?, aluno?)` (counts per student) and
`frequencia_diaria(inicio, fim, turma?, aluno?)` (daily totals). Periods are
`date` values, inclusive on both ends, limited to one year.

No performance score is stored or derived: indicators are raw counts and the
attendance rate `presenças / (presenças + ausências)`.
