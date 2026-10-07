import { getSupabase } from '@/lib/supabase';
import type { AttendanceStatus, Presenca } from '@/types/education';

type PresencaRow = { id: string; aluno_id: string; data: string; status: AttendanceStatus };

function fromRow(row: PresencaRow): Presenca {
  return { id: row.id, alunoId: row.aluno_id, data: row.data, status: row.status };
}

function throwIfError(error: { message: string } | null, fallback: string) {
  if (error) throw new Error(error.message || fallback);
}

/** Chamada de um dia para um conjunto de alunos (ex.: uma turma). */
export async function listPresencasDoDia(alunoIds: string[], data: string): Promise<Presenca[]> {
  if (alunoIds.length === 0) return [];
  const { data: rows, error } = await getSupabase()
    .from('presencas')
    .select('id, aluno_id, data, status')
    .eq('data', data)
    .in('aluno_id', alunoIds);
  throwIfError(error, 'Não foi possível carregar a chamada.');
  return ((rows ?? []) as PresencaRow[]).map(fromRow);
}

/** Histórico de presença de um aluno em um período inclusivo. */
export async function listPresencasDoAluno(alunoId: string, from: string, to: string): Promise<Presenca[]> {
  const { data, error } = await getSupabase()
    .from('presencas')
    .select('id, aluno_id, data, status')
    .eq('aluno_id', alunoId)
    .gte('data', from)
    .lte('data', to)
    .order('data', { ascending: false });
  throwIfError(error, 'Não foi possível carregar a presença.');
  return ((data ?? []) as PresencaRow[]).map(fromRow);
}

/**
 * Salva a chamada (uma linha por aluno/dia). Reenviar o mesmo dia atualiza
 * em vez de duplicar — garantido pela constraint única no banco.
 */
export async function saveChamada(entries: { alunoId: string; data: string; status: AttendanceStatus }[]): Promise<void> {
  if (entries.length === 0) return;
  const { error } = await getSupabase()
    .from('presencas')
    .upsert(
      entries.map((entry) => ({ aluno_id: entry.alunoId, data: entry.data, status: entry.status })),
      { onConflict: 'aluno_id,data' },
    );
  throwIfError(error, 'Não foi possível salvar a chamada.');
}
