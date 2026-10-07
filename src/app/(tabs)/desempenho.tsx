import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PeriodFilter } from '@/components/performance/period-filter';
import { AttentionList, ClassPerformanceItem, StudentPerformanceItem } from '@/components/performance/performance-lists';
import { StudentPerformanceView } from '@/components/performance/student-performance-view';
import { FrequencyCard, SummaryGrid } from '@/components/performance/summary-blocks';
import {
  Card,
  EmptyState,
  ErrorState,
  IconContainer,
  ListItem,
  LoadingState,
  PageHeader,
  Screen,
  SectionHeader,
  Select,
  UnauthorizedState,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { usePerformance } from '@/hooks/use-performance';
import { usePeriod } from '@/hooks/use-period';
import { useStudents } from '@/hooks/use-students';
import { attentionList, groupByClass, summarize } from '@/lib/performance';
import { can } from '@/types/auth';

const ALL = 'todas';

export default function DesempenhoScreen() {
  const { user } = useAuth();
  const { period, setPeriod, periodParams } = usePeriod();
  const { students, turmas, loading: loadingStudents, error: studentsError, reload: reloadStudents } = useStudents();
  const isResponsavel = user?.role === 'responsavel';
  const allowed = can(user?.role, 'desempenho:view');

  if (!allowed) return <UnauthorizedState />;

  return (
    <Screen
      header={
        <PageHeader
          title={isResponsavel ? 'Acompanhamento' : 'Desempenho'}
          subtitle={isResponsavel ? 'Frequência, atividades e registros' : 'Frequência, atividades e registros dos alunos'}
          action={{
            icon: 'notes',
            accessibilityLabel: 'Abrir relatórios',
            onPress: () => router.push({ pathname: '/relatorios', params: periodParams }),
          }}
        />
      }>
      <PeriodFilter value={period} onChange={setPeriod} />
      {loadingStudents && students.length === 0 ? (
        <LoadingState rows={3} label="Carregando" />
      ) : studentsError ? (
        <ErrorState message={studentsError} onRetry={reloadStudents} />
      ) : students.length === 0 ? (
        <EmptyState
          icon="students"
          title="Ainda não existem dados para exibir"
          description={isResponsavel
            ? 'Quando a escola vincular uma criança à sua conta, o acompanhamento aparecerá aqui.'
            : 'Quando houver alunos vinculados ao seu perfil, os indicadores aparecerão aqui.'}
        />
      ) : isResponsavel ? (
        <GuardianView students={students.map((student) => ({ id: student.id, nome: student.nome, turmaNome: student.turmaNome }))} period={period} />
      ) : (
        <StaffView
          turmas={turmas.map((turma) => ({ id: turma.id, nome: turma.nome }))}
          period={period}
          periodParams={periodParams}
          showSchoolTotals={can(user?.role, 'desempenho:escola')}
        />
      )}
    </Screen>
  );
}

/** Responsável: somente os próprios filhos (garantido pelo RLS), sem comparações. */
function GuardianView({
  students,
  period,
}: {
  students: { id: string; nome: string; turmaNome: string | null }[];
  period: ReturnType<typeof usePeriod>['period'];
}) {
  const [alunoId, setAlunoId] = useState(students[0].id);
  const selected = students.find((student) => student.id === alunoId) ?? students[0];

  return (
    <>
      {students.length > 1 ? (
        <Select
          label="Criança"
          value={selected.id}
          onChange={setAlunoId}
          options={students.map((student) => ({ value: student.id, label: student.nome, description: student.turmaNome ?? undefined }))}
        />
      ) : (
        <Card>
          <ListItem
            appearance="plain"
            title={selected.nome}
            subtitle={selected.turmaNome ?? 'Sem turma'}
            leading={<IconContainer icon="student" tone="green" />}
          />
        </Card>
      )}
      <StudentPerformanceView key={selected.id} alunoId={selected.id} period={period} />
    </>
  );
}

function StaffView({
  turmas,
  period,
  periodParams,
  showSchoolTotals,
}: {
  turmas: { id: string; nome: string }[];
  period: ReturnType<typeof usePeriod>['period'];
  periodParams: ReturnType<typeof usePeriod>['periodParams'];
  showSchoolTotals: boolean;
}) {
  const [turmaId, setTurmaId] = useState<string>(ALL);
  useEffect(() => {
    if (turmaId !== ALL && !turmas.some((turma) => turma.id === turmaId)) setTurmaId(ALL);
  }, [turmaId, turmas]);

  const { rows, daily, loading, error, reload } = usePerformance({ period, turmaId: turmaId === ALL ? null : turmaId });
  const summary = useMemo(() => summarize(rows), [rows]);
  const classes = useMemo(() => groupByClass(rows), [rows]);
  const attention = useMemo(() => attentionList(rows), [rows]);
  const showClasses = turmaId === ALL && classes.length > 1;

  const openStudent = (alunoId: string) =>
    router.push({ pathname: '/desempenho/aluno/[alunoId]', params: { alunoId, ...periodParams } });

  return (
    <>
      {turmas.length > 1 ? (
        <Select
          label="Turma"
          value={turmaId}
          onChange={setTurmaId}
          options={[
            { value: ALL, label: showSchoolTotals ? 'Todas as turmas da escola' : 'Todas as minhas turmas' },
            ...turmas.map((turma) => ({ value: turma.id, label: turma.nome })),
          ]}
        />
      ) : null}

      {loading && rows.length === 0 ? (
        <LoadingState rows={3} label="Carregando indicadores" />
      ) : error ? (
        <ErrorState title="Não foi possível carregar os dados" message={error} onRetry={reload} />
      ) : (
        <>
          <SummaryGrid summary={summary} loading={loading} showStudents />
          {summary.chamadas === 0 && summary.recordsCount === 0 && summary.activitiesCount === 0 ? (
            <EmptyState
              icon="calendar"
              tone="yellow"
              title="Nenhum registro encontrado para o período selecionado"
              description="Faça a chamada e adicione registros para acompanhar a evolução."
            />
          ) : null}
          <FrequencyCard summary={summary} daily={daily} period={period} />

          {attention.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Alunos que precisam de atenção" />
              <AttentionList items={attention} onPress={openStudent} />
            </View>
          ) : null}

          {showClasses ? (
            <View style={styles.section}>
              <SectionHeader title="Turmas" />
              <View style={styles.list}>
                {classes.map((item) => (
                  <ClassPerformanceItem
                    key={item.turmaId ?? 'sem-turma'}
                    item={item}
                    onPress={item.turmaId
                      ? () => router.push({ pathname: '/desempenho/turma/[turmaId]', params: { turmaId: item.turmaId as string, ...periodParams } })
                      : undefined}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <SectionHeader title="Alunos" />
              <View style={styles.list}>
                {rows.map((row) => (
                  <StudentPerformanceItem key={row.alunoId} row={row} onPress={() => openStudent(row.alunoId)} />
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <SectionHeader title="Relatórios" />
            <ListItem
              title="Relatórios de turma e de aluno"
              subtitle="Frequência, atividades e registros do período"
              leading={<IconContainer icon="notes" tone="purple" />}
              onPress={() => router.push({ pathname: '/relatorios', params: periodParams })}
            />
          </View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  list: { gap: Spacing.two },
});
