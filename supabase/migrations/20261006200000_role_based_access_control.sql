create or replace function public.current_app_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

create or replace function public.can_access_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.current_app_role() = 'direcao'
    or (
      public.current_app_role() = 'professor'
      and exists (
        select 1
        from public.alunos a
        join public.professor_turmas pt on pt.turma_id = a.turma_id
        where a.id = p_student_id
          and pt.professor_id = (select auth.uid())
      )
    )
    or (
      public.current_app_role() in ('apoio', 'professor_apoio')
      and exists (
        select 1
        from public.professor_apoio_alunos paa
        where paa.aluno_id = p_student_id
          and paa.professor_id = (select auth.uid())
      )
    )
    or (
      public.current_app_role() = 'responsavel'
      and exists (
        select 1
        from public.responsavel_alunos ra
        where ra.aluno_id = p_student_id
          and ra.responsavel_id = (select auth.uid())
      )
    );
$$;

create or replace function public.can_access_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.current_app_role() = 'direcao'
    or (
      public.current_app_role() = 'professor'
      and exists (
        select 1
        from public.professor_turmas pt
        where pt.turma_id = p_class_id
          and pt.professor_id = (select auth.uid())
      )
    )
    or exists (
      select 1
      from public.alunos a
      where a.turma_id = p_class_id
        and public.can_access_student(a.id)
    );
$$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.can_access_student(uuid) from public, anon;
revoke all on function public.can_access_class(uuid) from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.can_access_student(uuid) to authenticated;
grant execute on function public.can_access_class(uuid) to authenticated;

update public.profiles
set role = 'apoio'
where role = 'professor_apoio';

update auth.users
set raw_app_meta_data = jsonb_set(raw_app_meta_data, '{role}', '"apoio"'::jsonb, true)
where raw_app_meta_data ->> 'role' = 'professor_apoio';

revoke all on public.profiles, public.turmas, public.alunos,
  public.professor_turmas, public.professor_apoio_alunos, public.responsavel_alunos
  from anon, public;
grant select, insert, update, delete on public.profiles, public.turmas, public.alunos,
  public.professor_turmas, public.professor_apoio_alunos, public.responsavel_alunos
  to authenticated;

alter table public.profiles enable row level security;
alter table public.turmas enable row level security;
alter table public.alunos enable row level security;
alter table public.professor_turmas enable row level security;
alter table public.professor_apoio_alunos enable row level security;
alter table public.responsavel_alunos enable row level security;

drop policy if exists profiles_rbac_select on public.profiles;
drop policy if exists profiles_rbac_select_guard on public.profiles;
drop policy if exists profiles_rbac_insert on public.profiles;
drop policy if exists profiles_rbac_insert_guard on public.profiles;
drop policy if exists profiles_rbac_update on public.profiles;
drop policy if exists profiles_rbac_update_guard on public.profiles;
drop policy if exists profiles_rbac_delete on public.profiles;
drop policy if exists profiles_rbac_delete_guard on public.profiles;

create policy profiles_rbac_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.current_app_role() = 'direcao');
create policy profiles_rbac_select_guard on public.profiles
  as restrictive for select to authenticated
  using (id = (select auth.uid()) or public.current_app_role() = 'direcao');
create policy profiles_rbac_insert on public.profiles
  for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy profiles_rbac_insert_guard on public.profiles
  as restrictive for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy profiles_rbac_update on public.profiles
  for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy profiles_rbac_update_guard on public.profiles
  as restrictive for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy profiles_rbac_delete on public.profiles
  for delete to authenticated using (public.current_app_role() = 'direcao');
create policy profiles_rbac_delete_guard on public.profiles
  as restrictive for delete to authenticated using (public.current_app_role() = 'direcao');

drop policy if exists turmas_rbac_select on public.turmas;
drop policy if exists turmas_rbac_select_guard on public.turmas;
drop policy if exists turmas_rbac_insert on public.turmas;
drop policy if exists turmas_rbac_insert_guard on public.turmas;
drop policy if exists turmas_rbac_update on public.turmas;
drop policy if exists turmas_rbac_update_guard on public.turmas;
drop policy if exists turmas_rbac_delete on public.turmas;
drop policy if exists turmas_rbac_delete_guard on public.turmas;

create policy turmas_rbac_select on public.turmas
  for select to authenticated
  using (public.can_access_class(id));
create policy turmas_rbac_select_guard on public.turmas
  as restrictive for select to authenticated
  using (public.can_access_class(id));
create policy turmas_rbac_insert on public.turmas
  for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy turmas_rbac_insert_guard on public.turmas
  as restrictive for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy turmas_rbac_update on public.turmas
  for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy turmas_rbac_update_guard on public.turmas
  as restrictive for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy turmas_rbac_delete on public.turmas
  for delete to authenticated using (public.current_app_role() = 'direcao');
create policy turmas_rbac_delete_guard on public.turmas
  as restrictive for delete to authenticated using (public.current_app_role() = 'direcao');

drop policy if exists alunos_rbac_select on public.alunos;
drop policy if exists alunos_rbac_select_guard on public.alunos;
drop policy if exists alunos_rbac_insert on public.alunos;
drop policy if exists alunos_rbac_insert_guard on public.alunos;
drop policy if exists alunos_rbac_update on public.alunos;
drop policy if exists alunos_rbac_update_guard on public.alunos;
drop policy if exists alunos_rbac_delete on public.alunos;
drop policy if exists alunos_rbac_delete_guard on public.alunos;

create policy alunos_rbac_select on public.alunos
  for select to authenticated
  using (public.can_access_student(id));
create policy alunos_rbac_select_guard on public.alunos
  as restrictive for select to authenticated
  using (public.can_access_student(id));
create policy alunos_rbac_insert on public.alunos
  for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy alunos_rbac_insert_guard on public.alunos
  as restrictive for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy alunos_rbac_update on public.alunos
  for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy alunos_rbac_update_guard on public.alunos
  as restrictive for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy alunos_rbac_delete on public.alunos
  for delete to authenticated using (public.current_app_role() = 'direcao');
create policy alunos_rbac_delete_guard on public.alunos
  as restrictive for delete to authenticated using (public.current_app_role() = 'direcao');

drop policy if exists professor_turmas_rbac_select on public.professor_turmas;
drop policy if exists professor_turmas_rbac_select_guard on public.professor_turmas;
drop policy if exists professor_turmas_rbac_insert on public.professor_turmas;
drop policy if exists professor_turmas_rbac_insert_guard on public.professor_turmas;
drop policy if exists professor_turmas_rbac_update on public.professor_turmas;
drop policy if exists professor_turmas_rbac_update_guard on public.professor_turmas;
drop policy if exists professor_turmas_rbac_delete on public.professor_turmas;
drop policy if exists professor_turmas_rbac_delete_guard on public.professor_turmas;

create policy professor_turmas_rbac_select on public.professor_turmas
  for select to authenticated
  using (
    public.current_app_role() = 'direcao'
    or (public.current_app_role() = 'professor' and professor_id = (select auth.uid()))
  );
create policy professor_turmas_rbac_select_guard on public.professor_turmas
  as restrictive for select to authenticated
  using (
    public.current_app_role() = 'direcao'
    or (public.current_app_role() = 'professor' and professor_id = (select auth.uid()))
  );
create policy professor_turmas_rbac_insert on public.professor_turmas
  for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy professor_turmas_rbac_insert_guard on public.professor_turmas
  as restrictive for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy professor_turmas_rbac_update on public.professor_turmas
  for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy professor_turmas_rbac_update_guard on public.professor_turmas
  as restrictive for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy professor_turmas_rbac_delete on public.professor_turmas
  for delete to authenticated using (public.current_app_role() = 'direcao');
create policy professor_turmas_rbac_delete_guard on public.professor_turmas
  as restrictive for delete to authenticated using (public.current_app_role() = 'direcao');

drop policy if exists professor_apoio_alunos_rbac_select on public.professor_apoio_alunos;
drop policy if exists professor_apoio_alunos_rbac_select_guard on public.professor_apoio_alunos;
drop policy if exists professor_apoio_alunos_rbac_insert on public.professor_apoio_alunos;
drop policy if exists professor_apoio_alunos_rbac_insert_guard on public.professor_apoio_alunos;
drop policy if exists professor_apoio_alunos_rbac_update on public.professor_apoio_alunos;
drop policy if exists professor_apoio_alunos_rbac_update_guard on public.professor_apoio_alunos;
drop policy if exists professor_apoio_alunos_rbac_delete on public.professor_apoio_alunos;
drop policy if exists professor_apoio_alunos_rbac_delete_guard on public.professor_apoio_alunos;

create policy professor_apoio_alunos_rbac_select on public.professor_apoio_alunos
  for select to authenticated
  using (
    public.current_app_role() = 'direcao'
    or (
      public.current_app_role() in ('apoio', 'professor_apoio')
      and professor_id = (select auth.uid())
    )
  );
create policy professor_apoio_alunos_rbac_select_guard on public.professor_apoio_alunos
  as restrictive for select to authenticated
  using (
    public.current_app_role() = 'direcao'
    or (
      public.current_app_role() in ('apoio', 'professor_apoio')
      and professor_id = (select auth.uid())
    )
  );
create policy professor_apoio_alunos_rbac_insert on public.professor_apoio_alunos
  for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy professor_apoio_alunos_rbac_insert_guard on public.professor_apoio_alunos
  as restrictive for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy professor_apoio_alunos_rbac_update on public.professor_apoio_alunos
  for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy professor_apoio_alunos_rbac_update_guard on public.professor_apoio_alunos
  as restrictive for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy professor_apoio_alunos_rbac_delete on public.professor_apoio_alunos
  for delete to authenticated using (public.current_app_role() = 'direcao');
create policy professor_apoio_alunos_rbac_delete_guard on public.professor_apoio_alunos
  as restrictive for delete to authenticated using (public.current_app_role() = 'direcao');

drop policy if exists responsavel_alunos_rbac_select on public.responsavel_alunos;
drop policy if exists responsavel_alunos_rbac_select_guard on public.responsavel_alunos;
drop policy if exists responsavel_alunos_rbac_insert on public.responsavel_alunos;
drop policy if exists responsavel_alunos_rbac_insert_guard on public.responsavel_alunos;
drop policy if exists responsavel_alunos_rbac_update on public.responsavel_alunos;
drop policy if exists responsavel_alunos_rbac_update_guard on public.responsavel_alunos;
drop policy if exists responsavel_alunos_rbac_delete on public.responsavel_alunos;
drop policy if exists responsavel_alunos_rbac_delete_guard on public.responsavel_alunos;

create policy responsavel_alunos_rbac_select on public.responsavel_alunos
  for select to authenticated
  using (
    public.current_app_role() = 'direcao'
    or (public.current_app_role() = 'responsavel' and responsavel_id = (select auth.uid()))
  );
create policy responsavel_alunos_rbac_select_guard on public.responsavel_alunos
  as restrictive for select to authenticated
  using (
    public.current_app_role() = 'direcao'
    or (public.current_app_role() = 'responsavel' and responsavel_id = (select auth.uid()))
  );
create policy responsavel_alunos_rbac_insert on public.responsavel_alunos
  for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy responsavel_alunos_rbac_insert_guard on public.responsavel_alunos
  as restrictive for insert to authenticated with check (public.current_app_role() = 'direcao');
create policy responsavel_alunos_rbac_update on public.responsavel_alunos
  for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy responsavel_alunos_rbac_update_guard on public.responsavel_alunos
  as restrictive for update to authenticated
  using (public.current_app_role() = 'direcao')
  with check (public.current_app_role() = 'direcao');
create policy responsavel_alunos_rbac_delete on public.responsavel_alunos
  for delete to authenticated using (public.current_app_role() = 'direcao');
create policy responsavel_alunos_rbac_delete_guard on public.responsavel_alunos
  as restrictive for delete to authenticated using (public.current_app_role() = 'direcao');
