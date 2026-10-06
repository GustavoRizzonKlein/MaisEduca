do $$
begin
  if exists (
    select 1
    from public.alunos a
    where not exists (
      select 1
      from public.responsavel_alunos ra
      where ra.aluno_id = a.id
    )
  ) then
    raise exception 'Existem alunos sem responsável. Associe um responsável a cada aluno antes de aplicar esta migração.';
  end if;

  if exists (
    select 1
    from public.responsavel_alunos
    group by aluno_id
    having count(*) > 1
  ) then
    raise exception 'Existem alunos associados a mais de um responsável. Corrija os vínculos antes de aplicar esta migração.';
  end if;

  if exists (
    select 1
    from public.responsavel_alunos ra
    left join public.profiles p on p.id = ra.responsavel_id
    where p.id is null or p.role <> 'responsavel'
  ) then
    raise exception 'Existem vínculos associados a perfis que não são Responsáveis. Corrija os vínculos antes de aplicar esta migração.';
  end if;
end;
$$;

create unique index if not exists responsavel_alunos_one_responsavel_per_student
  on public.responsavel_alunos (aluno_id);

create or replace function public.validate_aluno_responsavel_association()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_aluno_id uuid;
begin
  if tg_table_name = 'alunos' then
    v_aluno_id := new.id;
  else
    v_aluno_id := old.aluno_id;
  end if;

  if exists (select 1 from public.alunos where id = v_aluno_id)
    and not exists (
      select 1 from public.responsavel_alunos where aluno_id = v_aluno_id
    ) then
    raise exception 'Todo aluno deve possuir um responsável associado.'
      using errcode = '23514';
  end if;

  return null;
end;
$$;

create or replace function public.validate_aluno_responsavel_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = new.responsavel_id
      and p.role = 'responsavel'
  ) then
    raise exception 'O vínculo deve apontar para um usuário com perfil Responsável.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists alunos_require_responsavel on public.alunos;
create constraint trigger alunos_require_responsavel
  after insert on public.alunos
  deferrable initially deferred
  for each row execute function public.validate_aluno_responsavel_association();

drop trigger if exists responsavel_alunos_keep_student_associated on public.responsavel_alunos;
create constraint trigger responsavel_alunos_keep_student_associated
  after delete or update on public.responsavel_alunos
  deferrable initially deferred
  for each row execute function public.validate_aluno_responsavel_association();

drop trigger if exists responsavel_alunos_require_responsavel_profile on public.responsavel_alunos;
create trigger responsavel_alunos_require_responsavel_profile
  before insert or update on public.responsavel_alunos
  for each row execute function public.validate_aluno_responsavel_role();

create or replace function public.create_aluno_with_responsavel(
  p_nome text,
  p_turma_id uuid,
  p_responsavel_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_aluno_id uuid;
begin
  if public.current_app_role() <> 'direcao' then
    raise exception 'Apenas a Direção pode cadastrar alunos.'
      using errcode = '42501';
  end if;
  if nullif(btrim(p_nome), '') is null or p_turma_id is null or p_responsavel_id is null then
    raise exception 'Informe o nome, a turma e um responsável para cadastrar o aluno.'
      using errcode = '23502';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_responsavel_id and role = 'responsavel'
  ) then
    raise exception 'Selecione um usuário com perfil Responsável.'
      using errcode = '23514';
  end if;

  insert into public.alunos (nome, turma_id)
  values (btrim(p_nome), p_turma_id)
  returning id into v_aluno_id;

  insert into public.responsavel_alunos (responsavel_id, aluno_id)
  values (p_responsavel_id, v_aluno_id);

  return v_aluno_id;
end;
$$;

create or replace function public.update_aluno_with_responsavel(
  p_aluno_id uuid,
  p_nome text,
  p_responsavel_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_app_role() <> 'direcao' then
    raise exception 'Apenas a Direção pode atualizar alunos.'
      using errcode = '42501';
  end if;
  if p_aluno_id is null or nullif(btrim(p_nome), '') is null or p_responsavel_id is null then
    raise exception 'Informe o nome e um responsável para atualizar o aluno.'
      using errcode = '23502';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_responsavel_id and role = 'responsavel'
  ) then
    raise exception 'Selecione um usuário com perfil Responsável.'
      using errcode = '23514';
  end if;

  update public.alunos
  set nome = btrim(p_nome), updated_at = now()
  where id = p_aluno_id;
  if not found then
    raise exception 'Aluno não encontrado.'
      using errcode = 'P0002';
  end if;

  delete from public.responsavel_alunos where aluno_id = p_aluno_id;
  insert into public.responsavel_alunos (responsavel_id, aluno_id)
  values (p_responsavel_id, p_aluno_id);

  return p_aluno_id;
end;
$$;

create or replace function public.set_responsavel_alunos(
  p_responsavel_id uuid,
  p_aluno_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_app_role() <> 'direcao' then
    raise exception 'Apenas a Direção pode alterar os vínculos de responsáveis.'
      using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = p_responsavel_id and role = 'responsavel'
  ) then
    raise exception 'O usuário informado não possui perfil Responsável.'
      using errcode = '23514';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_aluno_ids, array[]::uuid[])) as requested(aluno_id)
    where requested.aluno_id is null
  ) then
    raise exception 'A lista de alunos contém um identificador inválido.'
      using errcode = '22023';
  end if;

  delete from public.responsavel_alunos
  where aluno_id = any(coalesce(p_aluno_ids, array[]::uuid[]))
    and responsavel_id <> p_responsavel_id;

  delete from public.responsavel_alunos
  where responsavel_id = p_responsavel_id
    and not (aluno_id = any(coalesce(p_aluno_ids, array[]::uuid[])));

  insert into public.responsavel_alunos (responsavel_id, aluno_id)
  select p_responsavel_id, requested.aluno_id
  from (
    select distinct unnest(coalesce(p_aluno_ids, array[]::uuid[])) as aluno_id
  ) as requested
  where not exists (
    select 1
    from public.responsavel_alunos current_link
    where current_link.responsavel_id = p_responsavel_id
      and current_link.aluno_id = requested.aluno_id
  );
end;
$$;

revoke all on function public.validate_aluno_responsavel_association() from public, anon, authenticated;
revoke all on function public.validate_aluno_responsavel_role() from public, anon, authenticated;
revoke all on function public.create_aluno_with_responsavel(text, uuid, uuid) from public, anon;
revoke all on function public.update_aluno_with_responsavel(uuid, text, uuid) from public, anon;
revoke all on function public.set_responsavel_alunos(uuid, uuid[]) from public, anon;
grant execute on function public.create_aluno_with_responsavel(text, uuid, uuid) to authenticated;
grant execute on function public.update_aluno_with_responsavel(uuid, text, uuid) to authenticated;
grant execute on function public.set_responsavel_alunos(uuid, uuid[]) to authenticated;

drop policy if exists alunos_rbac_insert_guard on public.alunos;
create policy alunos_rbac_insert_guard on public.alunos
  as restrictive for insert to authenticated
  with check (false);
