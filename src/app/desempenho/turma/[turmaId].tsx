import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PeriodFilter } from '@/components/performance/period-filter';
import { AttentionList, StudentPerformanceItem } from '@/components/performance/performance-lists';
import { FrequencyCard, SummaryGrid } from '@/components/performance/summary-blocks';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Screen,
  SectionHeader,
  UnauthorizedState,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { usePerformance } from '@/hooks/use-performance';
import { usePeriod } from '@/hooks/use-period';
import { attentionList, summarize } from '@/lib/performance';
import { can } from '@/types/auth';

export default function TurmaPerformanceScreen() {
  const { turmaId: routeTurmaId } = useLocalSearchParams<{ turmaId: string | string[] }>();
  const turmaId = Array.isArray(routeTurmaId) ? routeTurmaId[0] : routeTurmaId;
  const { user } = useAuth();
  const { period, setPeriod, periodParams } = usePeriod();
  const allowed = can(user?.role, 'desempenho:view') && user?.role !== 'responsavel';
  const { rows, daily, loading, error, reload } = usePerformance({ period, turmaId }, allowed && Boolean(turmaId));
  const summary = useMemo(() => summarize(rows), [rows]);
  const attention = useMemo(() => attentionList(rows), [rows]);

  if (!allowed) return <UnauthorizedState />;

  const turmaNome = rows[0]?.turmaNome ?? 'Turma';
  const openStudent = (alunoId: string) =>
    router.push({ pathname: '/desempenho/aluno/[alunoId]', params: { alunoId, ...periodParams } });

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={
        <PageHeader
          title={turmaNome}
          subtitle={loading ? 'Carregando...' : `${rows.length} ${rows.length === 1 ? 'aluno' : 'alunos'}`}
          showBack
          backFallback="/desempenho"
          action={turmaId ? {
            icon: 'notes',
            accessibilityLabel: 'Relatório da turma',
            onPress: () => router.push({ pathname: '/relatorios/turma/[turmaId]', params: { turmaId, ...periodParams } }),
          } : undefined}
        />
      }>
      <PeriodFilter value={period} onChange={setPeriod} />
      {loading && rows.length === 0 ? (
        <LoadingState rows={4} label="Carregando turma" />
      ) : error ? (
        <ErrorState title="Não foi possível carregar os dados" message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="classes"
          tone="purple"
          title="Turma sem alunos acessíveis"
          description="Esta turma não tem alunos ou não está no escopo do seu perfil."
        />
      ) : (
        <>
          <SummaryGrid summary={summary} loading={loading} showStudents />
          <FrequencyCard summary={summary} daily={daily} period={period} />
          {attention.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Alunos que precisam de atenção" />
              <AttentionList items={attention} onPress={openStudent} />
            </View>
          ) : null}
          <View style={styles.section}>
            <SectionHeader title="Alunos" />
            <View style={styles.list}>
              {rows.map((row) => (
                <StudentPerformanceItem key={row.alunoId} row={row} onPress={() => openStudent(row.alunoId)} />
              ))}
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  list: { gap: Spacing.two },
});
