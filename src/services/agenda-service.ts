import { getSupabase } from '@/lib/supabase';
import type { AgendaItem, AgendaItemType } from '@/types/education';

type AgendaRow = {
  id: string;
  aluno_id: string;
  titulo: string;
  descricao: string | null;
  data: string;
  horario_inicio: string;
  horario_fim: string | null;
  tipo: AgendaItemType;
  disciplina: string | null;
  local: string | null;
  observacao: string | null;
};

const COLUMNS = 'id, aluno_id, titulo, descricao, data, horario_inicio, horario_fim, tipo, disciplina, local, observacao';

function fromRow(row: AgendaRow): AgendaItem {
  return {
    id: row.id,
    alunoId: row.aluno_id,
    titulo: row.titulo,
    descricao: row.descricao ?? undefined,
    data: row.data,
    horarioInicio: row.horario_inicio.slice(0, 5),
    horarioFim: row.horario_fim ? row.horario_fim.slice(0, 5) : undefined,
    tipo: row.tipo,
    disciplina: row.disciplina ?? undefined,
    local: row.local ?? undefined,
    observacao: row.observacao ?? undefined,
  };
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toRow(item: Omit<AgendaItem, 'id'>) {
  return {
    aluno_id: item.alunoId,
    titulo: item.titulo.trim(),
    descricao: emptyToNull(item.descricao),
    data: item.data,
    horario_inicio: item.horarioInicio,
    horario_fim: emptyToNull(item.horarioFim),
    tipo: item.tipo,
    disciplina: emptyToNull(item.disciplina),
    local: emptyToNull(item.local),
    observacao: emptyToNull(item.observacao),
  };
}

function throwIfError(error: { message: string } | null, fallback: string) {
  if (error) throw new Error(error.message || fallback);
}

/** Itens de agenda visíveis ao usuário (RLS), filtrados por aluno e período inclusivo. */
export async function listAgendaItems(filter: { alunoId?: string; from: string; to: string; limit?: number }): Promise<AgendaItem[]> {
  let query = getSupabase()
    .from('agenda_itens')
    .select(COLUMNS)
    .gte('data', filter.from)
    .lte('data', filter.to)
    .order('data')
    .order('horario_inicio');
  if (filter.alunoId) query = query.eq('aluno_id', filter.alunoId);
  if (filter.limit) query = query.limit(filter.limit);
  const { data, error } = await query;
  throwIfError(error, 'Não foi possível carregar a agenda.');
  return ((data ?? []) as AgendaRow[]).map(fromRow);
}

export async function createAgendaItem(item: Omit<AgendaItem, 'id'>): Promise<AgendaItem> {
  const { data, error } = await getSupabase().from('agenda_itens').insert(toRow(item)).select(COLUMNS).single();
  throwIfError(error, 'Não foi possível salvar a atividade.');
  return fromRow(data as AgendaRow);
}

export async function updateAgendaItem(item: AgendaItem): Promise<AgendaItem> {
  const { data, error } = await getSupabase()
    .from('agenda_itens')
    .update(toRow(item))
    .eq('id', item.id)
    .select(COLUMNS)
    .single();
  throwIfError(error, 'Não foi possível atualizar a atividade.');
  return fromRow(data as AgendaRow);
}

export async function deleteAgendaItem(id: string): Promise<void> {
  const { error } = await getSupabase().from('agenda_itens').delete().eq('id', id);
  throwIfError(error, 'Não foi possível excluir a atividade.');
}
