import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { periodFromParams, periodToParams } from '@/lib/periods';
import type { ReportPeriod } from '@/types/performance';

/**
 * Período do painel guardado nos parâmetros da rota (`periodo`, `inicio`, `fim`).
 * Navegar repassando `periodParams` mantém o mesmo filtro entre dashboard,
 * turma, aluno e relatório — garantindo números consistentes.
 */
export function usePeriod() {
  const params = useLocalSearchParams<{ periodo?: string; inicio?: string; fim?: string }>();
  const period = useMemo(
    () => periodFromParams({ periodo: params.periodo, inicio: params.inicio, fim: params.fim }),
    [params.periodo, params.inicio, params.fim],
  );
  const setPeriod = useCallback((next: ReportPeriod) => {
    router.setParams(periodToParams(next));
  }, []);
  return { period, setPeriod, periodParams: periodToParams(period) };
}
