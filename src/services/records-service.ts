import { getSupabase } from '@/lib/supabase';
import type { RecordCategory, Registro } from '@/types/education';

type RegistroRow = {
  id: string;
  aluno_id: string;
  data: string;
  categoria: RecordCategory;
  texto: string;
  criado_por: string | null;
  created_at: string;
};

const COLUMNS = 'id, aluno_id, data, categoria, texto, criado_por, created_at';

function fromRow(row: RegistroRow): Registro {
  return {
    id: row.id,
    alunoId: row.aluno_id,
    data: row.data,
    categoria: row.categoria,
    texto: row.texto,
    criadoPor: row.criado_por,
    createdAt: row.created_at,
  };
}

function throwIfError(error: { message: string } | null, fallback: string) {
  if (error) throw new Error(error.message || fallback);
}

export async function listRegistros(filter: { alunoId: string; from?: string; to?: string; limit?: number }): Promise<Registro[]> {
  let query = getSupabase()
    .from('registros')
    .select(COLUMNS)
    .eq('aluno_id', filter.alunoId)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false });
  if (filter.from) query = query.gte('data', filter.from);
  if (filter.to) query = query.lte('data', filter.to);
  if (filter.limit) query = query.limit(filter.limit);
  const { data, error } = await query;
  throwIfError(error, 'Não foi possível carregar os registros.');
  return ((data ?? []) as RegistroRow[]).map(fromRow);
}

export async function createRegistro(input: { alunoId: string; data: string; categoria: RecordCategory; texto: string }): Promise<Registro> {
  const { data, error } = await getSupabase()
    .from('registros')
    .insert({ aluno_id: input.alunoId, data: input.data, categoria: input.categoria, texto: input.texto.trim() })
    .select(COLUMNS)
    .single();
  throwIfError(error, 'Não foi possível salvar o registro.');
  return fromRow(data as RegistroRow);
}

export async function deleteRegistro(id: string): Promise<void> {
  const { data, error } = await getSupabase().from('registros').delete().eq('id', id).select('id');
  throwIfError(error, 'Não foi possível excluir o registro.');
  // O RLS não gera erro ao filtrar a linha: zero linhas = sem permissão.
  if (!data || data.length === 0) throw new Error('Somente o autor do registro ou a Direção podem excluí-lo.');
}
