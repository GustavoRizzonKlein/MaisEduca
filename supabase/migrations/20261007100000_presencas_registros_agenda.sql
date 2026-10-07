-- Presença, registros de acompanhamento e agenda persistida.
-- Base de dados real para o Painel de Desempenho e Relatórios.
--
-- Escopo de acesso: reutiliza public.can_access_student(), o mesmo critério
-- que já protege public.alunos (Direção: todos; Professor: alunos das suas
-- turmas; Professor de Apoio: alunos vinculados; Responsável: seus filhos).
-- Escrita: somente Direção, Professor e Professor de Apoio, e apenas para
-- alunos que eles já podem acessar.

create or replace function public.can_write_student_data(p_student_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select public.current_app_role() in ('direcao', 'professor', 'apoio', 'professor_apoio')
    and public.can_access_student(p_student_id);
$$;

revoke all on function public.can_write_student_data(uuid) from public, anon;
grant execute on function public.can_write_student_data(uuid) to authenticated;

-- Autor e datas de auditoria são definidos pelo servidor, nunca pelo cliente.
create or replace function public.set_row_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_por := (select auth.uid());
    new.created_at := now();
  else
    new.criado_por := old.criado_por;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_row_audit_fields() from public, anon;

-- ---------------------------------------------------------------------------
-- Presença (uma chamada por aluno por dia)
-- ---------------------------------------------------------------------------
create table if not exists public.presencas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos (id) on delete cascade,
  data date not null,
  status text not null check (status in ('presente', 'ausente')),
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presencas_um_registro_por_dia unique (aluno_id, data)
);

create index if not exists presencas_data_idx on public.presencas (data);

drop trigger if exists presencas_audit on public.presencas;
create trigger presencas_audit
  before insert or update on public.presencas
  for each row execute function public.set_row_audit_fields();

-- ---------------------------------------------------------------------------
-- Registros de acompanhamento (observações qualitativas)
-- ---------------------------------------------------------------------------
create table if not exists public.registros (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos (id) on delete cascade,
  data date not null,
  categoria text not null check (categoria in ('avanco', 'dificuldade', 'atividade', 'participacao')),
  texto text not null check (char_length(btrim(texto)) between 1 and 2000),
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists registros_aluno_data_idx on public.registros (aluno_id, data desc);

drop trigger if exists registros_audit on public.registros;
create trigger registros_audit
  before insert or update on public.registros
  for each row execute function public.set_row_audit_fields();

-- ---------------------------------------------------------------------------
-- Agenda (antes mantida apenas em memória no app)
-- ---------------------------------------------------------------------------
create table if not exists public.agenda_itens (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 200),
  descricao text,
  data date not null,
  horario_inicio time not null,
  horario_fim time,
  tipo text not null check (tipo in ('atividade', 'aula', 'intervalo', 'terapia', 'evento', 'outro')),
  disciplina text,
  local text,
  observacao text,
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agenda_itens_horario_valido check (horario_fim is null or horario_fim >= horario_inicio)
);

create index if not exists agenda_itens_aluno_data_idx on public.agenda_itens (aluno_id, data);
create index if not exists agenda_itens_data_idx on public.agenda_itens (data);

drop trigger if exists agenda_itens_audit on public.agenda_itens;
create trigger agenda_itens_audit
  before insert or update on public.agenda_itens
  for each row execute function public.set_row_audit_fields();

-- ---------------------------------------------------------------------------
-- Permissões e RLS (mesmo padrão permissive + restrictive das demais tabelas)
-- ---------------------------------------------------------------------------
revoke all on public.presencas, public.registros, public.agenda_itens from anon, public;
grant select, insert, update, delete on public.presencas, public.registros, public.agenda_itens to authenticated;

alter table public.presencas enable row level security;
alter table public.registros enable row level security;
alter table public.agenda_itens enable row level security;

-- presencas
drop policy if exists presencas_select on public.presencas;
drop policy if exists presencas_select_guard on public.presencas;
drop policy if exists presencas_insert on public.presencas;
drop policy if exists presencas_insert_guard on public.presencas;
drop policy if exists presencas_update on public.presencas;
drop policy if exists presencas_update_guard on public.presencas;
drop policy if exists presencas_delete on public.presencas;
drop policy if exists presencas_delete_guard on public.presencas;

create policy presencas_select on public.presencas
  for select to authenticated using (public.can_access_student(aluno_id));
create policy presencas_select_guard on public.presencas
  as restrictive for select to authenticated using (public.can_access_student(aluno_id));
create policy presencas_insert on public.presencas
  for insert to authenticated with check (public.can_write_student_data(aluno_id));
create policy presencas_insert_guard on public.presencas
  as restrictive for insert to authenticated with check (public.can_write_student_data(aluno_id));
create policy presencas_update on public.presencas
  for update to authenticated
  using (public.can_write_student_data(aluno_id))
  with check (public.can_write_student_data(aluno_id));
create policy presencas_update_guard on public.presencas
  as restrictive for update to authenticated
  using (public.can_write_student_data(aluno_id))
  with check (public.can_write_student_data(aluno_id));
create policy presencas_delete on public.presencas
  for delete to authenticated using (public.can_write_student_data(aluno_id));
create policy presencas_delete_guard on public.presencas
  as restrictive for delete to authenticated using (public.can_write_student_data(aluno_id));

-- registros: edição/exclusão apenas pelo autor ou pela Direção
drop policy if exists registros_select on public.registros;
drop policy if exists registros_select_guard on public.registros;
drop policy if exists registros_insert on public.registros;
drop policy if exists registros_insert_guard on public.registros;
drop policy if exists registros_update on public.registros;
drop policy if exists registros_update_guard on public.registros;
drop policy if exists registros_delete on public.registros;
drop policy if exists registros_delete_guard on public.registros;

create policy registros_select on public.registros
  for select to authenticated using (public.can_access_student(aluno_id));
create policy registros_select_guard on public.registros
  as restrictive for select to authenticated using (public.can_access_student(aluno_id));
create policy registros_insert on public.registros
  for insert to authenticated with check (public.can_write_student_data(aluno_id));
create policy registros_insert_guard on public.registros
  as restrictive for insert to authenticated with check (public.can_write_student_data(aluno_id));
create policy registros_update on public.registros
  for update to authenticated
  using (
    public.can_write_student_data(aluno_id)
    and (criado_por = (select auth.uid()) or public.current_app_role() = 'direcao')
  )
  with check (public.can_write_student_data(aluno_id));
create policy registros_update_guard on public.registros
  as restrictive for update to authenticated
  using (
    public.can_write_student_data(aluno_id)
    and (criado_por = (select auth.uid()) or public.current_app_role() = 'direcao')
  )
  with check (public.can_write_student_data(aluno_id));
create policy registros_delete on public.registros
  for delete to authenticated
  using (
    public.can_write_student_data(aluno_id)
    and (criado_por = (select auth.uid()) or public.current_app_role() = 'direcao')
  );
create policy registros_delete_guard on public.registros
  as restrictive for delete to authenticated
  using (
    public.can_write_student_data(aluno_id)
    and (criado_por = (select auth.uid()) or public.current_app_role() = 'direcao')
  );

-- agenda_itens
drop policy if exists agenda_itens_select on public.agenda_itens;
drop policy if exists agenda_itens_select_guard on public.agenda_itens;
drop policy if exists agenda_itens_insert on public.agenda_itens;
drop policy if exists agenda_itens_insert_guard on public.agenda_itens;
drop policy if exists agenda_itens_update on public.agenda_itens;
drop policy if exists agenda_itens_update_guard on public.agenda_itens;
drop policy if exists agenda_itens_delete on public.agenda_itens;
drop policy if exists agenda_itens_delete_guard on public.agenda_itens;

create policy agenda_itens_select on public.agenda_itens
  for select to authenticated using (public.can_access_student(aluno_id));
create policy agenda_itens_select_guard on public.agenda_itens
  as restrictive for select to authenticated using (public.can_access_student(aluno_id));
create policy agenda_itens_insert on public.agenda_itens
  for insert to authenticated with check (public.can_write_student_data(aluno_id));
create policy agenda_itens_insert_guard on public.agenda_itens
  as restrictive for insert to authenticated with check (public.can_write_student_data(aluno_id));
create policy agenda_itens_update on public.agenda_itens
  for update to authenticated
  using (public.can_write_student_data(aluno_id))
  with check (public.can_write_student_data(aluno_id));
create policy agenda_itens_update_guard on public.agenda_itens
  as restrictive for update to authenticated
  using (public.can_write_student_data(aluno_id))
  with check (public.can_write_student_data(aluno_id));
create policy agenda_itens_delete on public.agenda_itens
  for delete to authenticated using (public.can_write_student_data(aluno_id));
create policy agenda_itens_delete_guard on public.agenda_itens
  as restrictive for delete to authenticated using (public.can_write_student_data(aluno_id));

-- ---------------------------------------------------------------------------
-- Consultas agregadas do Painel de Desempenho.
-- SECURITY INVOKER: o RLS de alunos/turmas/presencas/registros/agenda_itens
-- continua valendo, então cada perfil só recebe linhas do próprio escopo.
-- Datas são `date` (sem horário): o período é inclusivo nas duas pontas e não
-- sofre efeito de fuso horário.
-- ---------------------------------------------------------------------------
create or replace function public.desempenho_por_aluno(
  p_inicio date,
  p_fim date,
  p_turma_id uuid default null,
  p_aluno_id uuid default null
)
returns table (
  aluno_id uuid,
  aluno_nome text,
  turma_id uuid,
  turma_nome text,
  presencas integer,
  ausencias integer,
  registros integer,
  atividades integer,
  ultimo_registro date
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  if p_inicio is null or p_fim is null or p_inicio > p_fim then
    raise exception 'Período inválido.';
  end if;
  if p_fim - p_inicio > 366 then
    raise exception 'O período máximo é de um ano.';
  end if;

  return query
  select
    a.id,
    a.nome,
    a.turma_id,
    t.nome,
    coalesce(pr.presencas, 0)::integer,
    coalesce(pr.ausencias, 0)::integer,
    coalesce(rg.total, 0)::integer,
    coalesce(ag.total, 0)::integer,
    rg.ultimo
  from public.alunos a
  left join public.turmas t on t.id = a.turma_id
  left join lateral (
    select
      count(*) filter (where p.status = 'presente') as presencas,
      count(*) filter (where p.status = 'ausente') as ausencias
    from public.presencas p
    where p.aluno_id = a.id and p.data between p_inicio and p_fim
  ) pr on true
  left join lateral (
    select count(*) as total, max(r.data) as ultimo
    from public.registros r
    where r.aluno_id = a.id and r.data between p_inicio and p_fim
  ) rg on true
  left join lateral (
    select count(*) as total
    from public.agenda_itens i
    where i.aluno_id = a.id and i.data between p_inicio and p_fim
  ) ag on true
  where (p_turma_id is null or a.turma_id = p_turma_id)
    and (p_aluno_id is null or a.id = p_aluno_id)
  order by a.nome;
end;
$$;

create or replace function public.frequencia_diaria(
  p_inicio date,
  p_fim date,
  p_turma_id uuid default null,
  p_aluno_id uuid default null
)
returns table (data date, presencas integer, ausencias integer)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
begin
  if p_inicio is null or p_fim is null or p_inicio > p_fim then
    raise exception 'Período inválido.';
  end if;
  if p_fim - p_inicio > 366 then
    raise exception 'O período máximo é de um ano.';
  end if;

  return query
  select
    p.data,
    (count(*) filter (where p.status = 'presente'))::integer,
    (count(*) filter (where p.status = 'ausente'))::integer
  from public.presencas p
  join public.alunos a on a.id = p.aluno_id
  where p.data between p_inicio and p_fim
    and (p_turma_id is null or a.turma_id = p_turma_id)
    and (p_aluno_id is null or p.aluno_id = p_aluno_id)
  group by p.data
  order by p.data;
end;
$$;

revoke all on function public.desempenho_por_aluno(date, date, uuid, uuid) from public, anon;
revoke all on function public.frequencia_diaria(date, date, uuid, uuid) from public, anon;
grant execute on function public.desempenho_por_aluno(date, date, uuid, uuid) to authenticated;
grant execute on function public.frequencia_diaria(date, date, uuid, uuid) to authenticated;
