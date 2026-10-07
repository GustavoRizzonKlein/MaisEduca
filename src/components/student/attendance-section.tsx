import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/performance/charts';
import { ThemedText } from '@/components/themed-text';
import { Badge, Card, Divider, EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { addDays, formatDate, formatLongDate } from '@/lib/dates';
import { attendanceRate, attendanceStatus, count, formatRate } from '@/lib/performance';
import { listPresencasDoAluno } from '@/services/attendance-service';
import type { Presenca } from '@/types/education';

const WINDOW_DAYS = 30;

/** Histórico de presença dos últimos 30 dias de um aluno. */
export function AttendanceSection({ alunoId, canEdit }: { alunoId: string; canEdit: boolean }) {
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const to = formatDate(new Date());
  const from = formatDate(addDays(new Date(), -(WINDOW_DAYS - 1)));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPresencas(await listPresencasDoAluno(alunoId, from, to));
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a presença.');
    } finally {
      setLoading(false);
    }
  }, [alunoId, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const presentes = presencas.filter((presenca) => presenca.status === 'presente').length;
    const ausentes = presencas.length - presentes;
    return { presentes, ausentes, rate: attendanceRate(presentes, ausentes) };
  }, [presencas]);

  if (loading) return <LoadingState rows={2} label="Carregando presença" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (presencas.length === 0) {
    return (
      <EmptyState
        icon="attendance"
        tone="green"
        title="Nenhuma chamada nos últimos 30 dias"
        description={canEdit ? 'Use "Fazer chamada" na turma para registrar a presença.' : 'Quando a escola registrar a chamada, ela aparecerá aqui.'}
      />
    );
  }

  const status = attendanceStatus(totals.rate);

  return (
    <View style={styles.wrap}>
      <Card style={styles.summary}>
        <View style={styles.header}>
          <ThemedText type="heading">Últimos 30 dias</ThemedText>
          <Badge label={status.label} tone={status.tone} />
        </View>
        <ProgressBar value={totals.rate} label="Frequência nos últimos 30 dias" />
        <ThemedText type="caption" themeColor="textMuted">
          Frequência {formatRate(totals.rate)} • {count(totals.presentes, 'presenca')} • {count(totals.ausentes, 'ausencia')}
        </ThemedText>
      </Card>
      <Card style={styles.list}>
        {presencas.map((presenca, index) => (
          <View key={presenca.id}>
            <View style={styles.row}>
              <ThemedText type="small" style={styles.flex}>{formatLongDate(presenca.data)}</ThemedText>
              <Badge
                label={presenca.status === 'presente' ? 'Presente' : 'Ausente'}
                tone={presenca.status === 'presente' ? 'green' : 'peach'}
                icon={presenca.status === 'presente' ? 'check' : 'close'}
              />
            </View>
            {index < presencas.length - 1 ? <Divider /> : null}
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  summary: { gap: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  list: { paddingVertical: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 48 },
  flex: { flex: 1 },
});
