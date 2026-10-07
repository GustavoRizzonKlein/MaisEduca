import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchPerformance } from '@/services/performance-service';
import type { PerformanceData, ReportFilter } from '@/types/performance';

/** Carrega os dados agregados do painel para um filtro (período/turma/aluno). */
export function usePerformance(filter: ReportFilter, enabled = true) {
  const [data, setData] = useState<PerformanceData>({ rows: [], daily: [] });
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const { inicio, fim } = filter.period;
  const turmaId = filter.turmaId ?? null;
  const alunoId = filter.alunoId ?? null;
  const stableFilter = useMemo<ReportFilter>(
    () => ({ period: { preset: filter.period.preset, inicio, fim }, turmaId, alunoId }),
    [filter.period.preset, inicio, fim, turmaId, alunoId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchPerformance(stableFilter));
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [stableFilter]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return { ...data, loading, error, reload: load };
}
