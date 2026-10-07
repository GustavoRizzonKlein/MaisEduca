import { getSupabase } from '@/lib/supabase';
import type { DailyAttendance, PerformanceByStudent, PerformanceData, ReportFilter } from '@/types/performance';

type PerformanceRow = {
  aluno_id: string;
  aluno_nome: string;
  turma_id: string | null;
  turma_nome: string | null;
  presencas: number;
  ausencias: number;
  registros: number;
  atividades: number;
  ultimo_registro: string | null;
};

type DailyRow = { data: string; presencas: number; ausencias: number };

function rpcArgs(filter: ReportFilter) {
  return {
    p_inicio: filter.period.inicio,
    p_fim: filter.period.fim,
    p_turma_id: filter.turmaId ?? null,
    p_aluno_id: filter.alunoId ?? null,
  };
}

/**
 * Dados agregados do painel em duas consultas (sem uma query por aluno).
 * As funções são SECURITY INVOKER: o RLS limita o resultado ao escopo do perfil.
 */
export async function fetchPerformance(filter: ReportFilter): Promise<PerformanceData> {
  const supabase = getSupabase();
  const args = rpcArgs(filter);
  const [rowsResult, dailyResult] = await Promise.all([
    supabase.rpc('desempenho_por_aluno', args),
    supabase.rpc('frequencia_diaria', args),
  ]);
  if (rowsResult.error) throw new Error(rowsResult.error.message || 'Não foi possível carregar o desempenho.');
  if (dailyResult.error) throw new Error(dailyResult.error.message || 'Não foi possível carregar a frequência.');

  const rows: PerformanceByStudent[] = ((rowsResult.data ?? []) as PerformanceRow[]).map((row) => ({
    alunoId: row.aluno_id,
    alunoNome: row.aluno_nome,
    turmaId: row.turma_id,
    turmaNome: row.turma_nome,
    presencas: Number(row.presencas),
    ausencias: Number(row.ausencias),
    registros: Number(row.registros),
    atividades: Number(row.atividades),
    ultimoRegistro: row.ultimo_registro,
  }));
  const daily: DailyAttendance[] = ((dailyResult.data ?? []) as DailyRow[]).map((row) => ({
    data: row.data,
    presencas: Number(row.presencas),
    ausencias: Number(row.ausencias),
  }));
  return { rows, daily };
}
