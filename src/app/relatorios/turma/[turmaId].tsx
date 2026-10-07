import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { ReportHeader, ReportRow, ReportSection, ShareReportButton } from '@/components/performance/report-blocks';
import { FrequencyCard } from '@/components/performance/summary-blocks';
import { ThemedText } from '@/components/themed-text';
import { EmptyState, ErrorState, LoadingState, PageHeader, Screen, UnauthorizedState } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import { usePerformance } from '@/hooks/use-performance';
import { usePeriod } from '@/hooks/use-period';
import { attendanceBreakdown, count, formatRate, studentRate, summarize } from '@/lib/performance';
import { buildClassReportText } from '@/lib/report-text';
import { can } from '@/types/auth';

export default function ClassReportScreen() {
  const { turmaId: routeTurmaId } = useLocalSearchParams<{ turmaId: string | string[] }>();
  const turmaId = Array.isArray(routeTurmaId) ? routeTurmaId[0] : routeTurmaId;
  const { user } = useAuth();
  const { period } = usePeriod();
  const allowed = can(user?.role, 'desempenho:view') && user?.role !== 'responsavel';
  const { rows, daily, loading, error, reload } = usePerformance({ period, turmaId }, allowed && Boolean(turmaId));
  const summary = useMemo(() => summarize(rows), [rows]);

  if (!allowed) return <UnauthorizedState />;
  const turmaNome = rows[0]?.turmaNome ?? 'Turma';

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={<PageHeader title="Relatório da turma" showBack backFallback="/relatorios" />}>
      {loading && rows.length === 0 ? (
        <LoadingState rows={4} label="Gerando relatório" />
      ) : error ? (
        <ErrorState title="Não foi possível carregar os dados" message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="notes"
          tone="purple"
          title="Ainda não existem dados suficientes para gerar este relatório"
          description="A turma não tem alunos acessíveis ao seu perfil."
        />
      ) : (
        <>
          <ReportHeader title="Relatório da turma" subject={turmaNome} period={period} />
          <ReportSection title="Resumo">
            <ReportRow label="Alunos" value={String(summary.studentsCount)} />
            <ReportRow
              label="Frequência"
              value={formatRate(summary.attendanceRate)}
              detail={attendanceBreakdown(summary.presencas, summary.ausencias)}
            />
            <ReportRow label="Atividades planejadas" value={String(summary.activitiesCount)} />
            <ReportRow label="Registros de acompanhamento" value={String(summary.recordsCount)} detail={`${count(summary.studentsWithRecords, 'aluno')} com registros`} last />
          </ReportSection>
          <FrequencyCard summary={summary} daily={daily} period={period} />
          <ReportSection title="Alunos">
            <ThemedText type="caption" themeColor="textMuted">Em ordem alfabética. Frequência = presenças ÷ chamadas no período.</ThemedText>
            {rows.map((row, index) => (
              <ReportRow
                key={row.alunoId}
                label={row.alunoNome}
                value={formatRate(studentRate(row))}
                detail={`${row.presencas}P / ${row.ausencias}A • ${count(row.registros, 'registro')} • ${count(row.atividades, 'atividade')}`}
                last={index === rows.length - 1}
              />
            ))}
          </ReportSection>
          <ShareReportButton
            title={`Relatório da turma ${turmaNome}`}
            buildText={() => buildClassReportText({ turmaNome, period, summary, rows, daily })}
          />
        </>
      )}
    </Screen>
  );
}
