import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, Card, EmptyState } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { attendanceStatus, count, formatRate } from '@/lib/performance';
import type { DailyAttendance, PerformanceSummary, ReportPeriod } from '@/types/performance';

import { attendanceChartData } from './chart-data';
import { BarChart, ProgressBar } from './charts';
import { MetricGrid, type Metric } from './metric-card';

/** Indicadores principais, sempre com o dado bruto na legenda. */
export function summaryMetrics(summary: PerformanceSummary, options: { showStudents?: boolean } = {}): Metric[] {
  const metrics: Metric[] = [
    {
      label: 'Frequência',
      value: formatRate(summary.attendanceRate),
      caption: summary.chamadas > 0
        ? `${count(summary.presencas, 'presenca')} • ${count(summary.ausencias, 'ausencia')}`
        : 'Sem chamadas no período',
      icon: 'attendance',
      tone: 'blue',
    },
    {
      label: 'Atividades',
      value: String(summary.activitiesCount),
      caption: 'planejadas na agenda',
      icon: 'calendar',
      tone: 'green',
    },
    {
      label: 'Registros',
      value: String(summary.recordsCount),
      caption: options.showStudents
        ? `${count(summary.studentsWithRecords, 'aluno')} com registros`
        : 'de acompanhamento',
      icon: 'notes',
      tone: 'purple',
    },
  ];
  if (options.showStudents) {
    metrics.push({
      label: 'Alunos',
      value: String(summary.studentsCount),
      caption: `${summary.studentsWithAttendance} com chamada no período`,
      icon: 'students',
      tone: 'peach',
    });
  }
  return metrics;
}

export function SummaryGrid({ summary, loading, showStudents }: { summary: PerformanceSummary; loading?: boolean; showStudents?: boolean }) {
  return <MetricGrid metrics={summaryMetrics(summary, { showStudents })} loading={loading} />;
}

/** Card de frequência: barra consolidada + gráfico por dia/semana. */
export function FrequencyCard({
  summary,
  daily,
  period,
}: {
  summary: PerformanceSummary;
  daily: DailyAttendance[];
  period: ReportPeriod;
}) {
  const status = attendanceStatus(summary.attendanceRate);
  const chart = attendanceChartData(daily, period);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="heading">Frequência</ThemedText>
        <Badge label={status.label} tone={status.tone} />
      </View>
      {summary.chamadas === 0 ? (
        <EmptyState
          icon="attendance"
          tone="blue"
          title="Nenhuma chamada no período"
          description="Quando a chamada for registrada, a frequência aparecerá aqui."
        />
      ) : (
        <>
          <ProgressBar value={summary.attendanceRate} label="Frequência no período" />
          <ThemedText type="caption" themeColor="textMuted">
            {count(summary.presencas, 'presenca')} em {count(summary.chamadas, 'chamada')} registradas.
          </ThemedText>
          <View style={styles.chart}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {chart.granularity === 'dia' ? 'Por dia' : 'Por semana (últimas 8)'}
            </ThemedText>
            <BarChart data={chart.data} referenceLabel="mín. 75%" />
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  chart: { gap: Spacing.three, marginTop: Spacing.two },
});
