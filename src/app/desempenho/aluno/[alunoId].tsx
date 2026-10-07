import { router, useLocalSearchParams } from 'expo-router';

import { PeriodFilter } from '@/components/performance/period-filter';
import { StudentPerformanceView } from '@/components/performance/student-performance-view';
import { LoadingState, PageHeader, Screen, UnauthorizedState } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import { usePeriod } from '@/hooks/use-period';
import { useStudents } from '@/hooks/use-students';
import { can } from '@/types/auth';

export default function AlunoPerformanceScreen() {
  const { alunoId: routeAlunoId } = useLocalSearchParams<{ alunoId: string | string[] }>();
  const alunoId = Array.isArray(routeAlunoId) ? routeAlunoId[0] : routeAlunoId;
  const { user } = useAuth();
  const { period, setPeriod, periodParams } = usePeriod();
  const { students, loading } = useStudents();

  if (!can(user?.role, 'desempenho:view')) return <UnauthorizedState />;

  const student = students.find((candidate) => candidate.id === alunoId);
  // O RLS só devolve alunos do escopo do perfil.
  if (!loading && !student) {
    return (
      <UnauthorizedState
        title="Aluno indisponível"
        message={'Este aluno não existe ou não está vinculado ao seu perfil.\nEntre em contato com a direção caso precise de acesso.'}
      />
    );
  }

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={
        <PageHeader
          title={student?.nome ?? 'Aluno'}
          subtitle={student?.turmaNome ?? undefined}
          showBack
          backFallback="/desempenho"
          action={alunoId ? {
            icon: 'notes',
            accessibilityLabel: 'Relatório do aluno',
            onPress: () => router.push({ pathname: '/relatorios/aluno/[alunoId]', params: { alunoId, ...periodParams } }),
          } : undefined}
        />
      }>
      <PeriodFilter value={period} onChange={setPeriod} />
      {!student || !alunoId ? <LoadingState rows={3} /> : <StudentPerformanceView alunoId={alunoId} period={period} />}
    </Screen>
  );
}
