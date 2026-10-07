import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ReportHeader, ReportRow, ReportSection, ShareReportButton } from '@/components/performance/report-blocks';
import { FrequencyCard } from '@/components/performance/summary-blocks';
import { ThemedText } from '@/components/themed-text';
import { Badge, EmptyState, ErrorState, LoadingState, PageHeader, Screen, UnauthorizedState } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { usePerformance } from '@/hooks/use-performance';
import { usePeriod } from '@/hooks/use-period';
import { attendanceBreakdown, formatRate, recordCategoryConfig, summarize } from '@/lib/performance';
import { formatShortDate } from '@/lib/periods';
import { buildStudentReportText } from '@/lib/report-text';
import { listPresencasDoAluno } from '@/services/attendance-service';
import { listRegistros } from '@/services/records-service';
import { can } from '@/types/auth';
import type { Presenca, Registro } from '@/types/education';

export default function StudentReportScreen() {
  const { alunoId: routeAlunoId } = useLocalSearchParams<{ alunoId: string | string[] }>();
  const alunoId = Array.isArray(routeAlunoId) ? routeAlunoId[0] : routeAlunoId;
  const { user } = useAuth();
  const { period } = usePeriod();
  const allowed = can(user?.role, 'desempenho:view');
  // Filtrar por aluno_id + RLS: o relatório nunca inclui outros alunos.
  const { rows, daily, loading, error, reload } = usePerformance({ period, alunoId }, allowed && Boolean(alunoId));
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [ausencias, setAusencias] = useState<Presenca[]>([]);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!alunoId) return;
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
    if (allowed) void loadDetails();
  }, [allowed, loadDetails]);

  const summary = useMemo(() => summarize(rows), [rows]);

  if (!allowed) return <UnauthorizedState />;
  const student = rows[0];

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={<PageHeader title="Relatório do aluno" showBack backFallback="/relatorios" />}>
      {loading && rows.length === 0 ? (
        <LoadingState rows={4} label="Gerando relatório" />
      ) : error || detailError ? (
        <ErrorState
          title="Não foi possível carregar os dados"
          message={error ?? detailError ?? ''}
          onRetry={() => {
            void reload();
            void loadDetails();
          }}
        />
      ) : !student ? (
        <UnauthorizedState
          title="Aluno indisponível"
          message={'Este aluno não existe ou não está vinculado ao seu perfil.'}
        />
      ) : (
        <>
          <ReportHeader
            title="Relatório do aluno"
            subject={student.alunoNome}
            period={period}
          />
          <ReportSection title="Resumo">
            <ReportRow label="Turma" value={student.turmaNome ?? 'Sem turma'} />
            <ReportRow
              label="Frequência"
              value={formatRate(summary.attendanceRate)}
              detail={attendanceBreakdown(summary.presencas, summary.ausencias)}
            />
            <ReportRow label="Atividades planejadas" value={String(summary.activitiesCount)} />
            <ReportRow label="Registros de acompanhamento" value={String(summary.recordsCount)} last />
          </ReportSection>
          <FrequencyCard summary={summary} daily={daily} period={period} />
          <ReportSection title="Ausências">
            {ausencias.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">Nenhuma ausência registrada no período.</ThemedText>
            ) : (
              <View style={styles.chips}>
                {ausencias.map((ausencia) => (
                  <Badge key={ausencia.id} label={formatShortDate(ausencia.data)} tone="peach" icon="calendar" />
                ))}
              </View>
            )}
          </ReportSection>
          <ReportSection title="Registros">
            {registros.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">Nenhum registro no período.</ThemedText>
            ) : (
              registros.map((registro) => {
                const category = recordCategoryConfig(registro.categoria);
                return (
                  <View key={registro.id} style={styles.record}>
                    <View style={styles.recordHeader}>
                      <Badge label={category.label} tone={category.tone} />
                      <ThemedText type="caption" themeColor="textMuted">{formatShortDate(registro.data)}</ThemedText>
                    </View>
                    <ThemedText type="small">{registro.texto}</ThemedText>
                  </View>
                );
              })
            )}
          </ReportSection>
          <ShareReportButton
            title={`Relatório de ${student.alunoNome}`}
            buildText={() =>
              buildStudentReportText({
                alunoNome: student.alunoNome,
                turmaNome: student.turmaNome,
                period,
                summary,
                daily,
                registros,
                ausencias,
              })}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  record: { gap: Spacing.one, paddingVertical: Spacing.one },
  recordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
});
