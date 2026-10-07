import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, Card, EmptyState, ErrorState, LoadingState, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { usePerformance } from '@/hooks/use-performance';
import { recordCategoryConfig, recordsByCategory, summarize } from '@/lib/performance';
import { formatShortDate } from '@/lib/periods';
import { listPresencasDoAluno } from '@/services/attendance-service';
import { listRegistros } from '@/services/records-service';
import type { Presenca, Registro } from '@/types/education';
import type { ReportPeriod } from '@/types/performance';

import { CountBars } from './charts';
import { FrequencyCard, SummaryGrid } from './summary-blocks';

/**
 * Desempenho individual: frequência, atividades, registros e histórico.
 * Mostra apenas dados brutos — não há nota nem classificação automática.
 */
export function StudentPerformanceView({ alunoId, period }: { alunoId: string; period: ReportPeriod }) {
  const { rows, daily, loading, error, reload } = usePerformance({ period, alunoId });
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [ausencias, setAusencias] = useState<Presenca[]>([]);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    setDetailError(null);
    try {
      const [nextRegistros, presencas] = await Promise.all([
        listRegistros({ alunoId, from: period.inicio, to: period.fim }),
        listPresencasDoAluno(alunoId, period.inicio, period.fim),
      ]);
      setRegistros(nextRegistros);
      setAusencias(presencas.filter((presenca) => presenca.status === 'ausente'));
    } catch (loadError: unknown) {
      setDetailError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o histórico.');
    }
  }, [alunoId, period.inicio, period.fim]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const summary = useMemo(() => summarize(rows), [rows]);
  const categories = useMemo(() => recordsByCategory(registros), [registros]);

  if (loading && rows.length === 0) return <LoadingState rows={3} label="Carregando desempenho" />;
  if (error || detailError) {
    return (
      <ErrorState
        message={error ?? detailError ?? ''}
        onRetry={() => {
          void reload();
          void loadDetails();
        }}
      />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        icon="student"
        title="Aluno indisponível"
        description="Este aluno não está vinculado ao seu perfil."
      />
    );
  }

  const hasAnyData = summary.chamadas > 0 || summary.recordsCount > 0 || summary.activitiesCount > 0;

  return (
    <View style={styles.wrap}>
      <SummaryGrid summary={summary} loading={loading} />

      {!hasAnyData ? (
        <EmptyState
          icon="calendar"
          tone="yellow"
          title="Nenhum registro encontrado para o período selecionado"
          description="Experimente ampliar o período no filtro acima."
        />
      ) : null}

      <FrequencyCard summary={summary} daily={daily} period={period} />

      <View style={styles.section}>
        <SectionHeader title="Registros por categoria" />
        {registros.length === 0 ? (
          <EmptyState icon="notes" tone="purple" title="Sem registros no período" />
        ) : (
          <Card>
            <CountBars data={categories.map((category) => ({ key: category.value, label: category.label, count: category.count, tone: category.tone }))} />
          </Card>
        )}
      </View>

      {registros.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Registros recentes" />
          <Card style={styles.list}>
            {registros.slice(0, 5).map((registro) => {
              const category = recordCategoryConfig(registro.categoria);
              return (
                <View key={registro.id} style={styles.recordRow}>
                  <View style={styles.recordHeader}>
                    <Badge label={category.label} tone={category.tone} />
                    <ThemedText type="caption" themeColor="textMuted">{formatShortDate(registro.data)}</ThemedText>
                  </View>
                  <ThemedText type="small" numberOfLines={3}>{registro.texto}</ThemedText>
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}

      {ausencias.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Ausências no período" />
          <Card>
            <View style={styles.chips}>
              {ausencias.map((ausencia) => (
                <Badge key={ausencia.id} label={formatShortDate(ausencia.data)} tone="peach" icon="calendar" />
              ))}
            </View>
          </Card>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.four },
  section: { gap: Spacing.three },
  list: { gap: Spacing.three },
  recordRow: { gap: Spacing.one },
  recordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
