import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { AgendaPanel } from '@/components/agenda/agenda-panel';
import { EmptyState, ErrorState, LoadingState, PageHeader, Screen, Select, UnauthorizedState } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import { useStudents } from '@/hooks/use-students';
import { can } from '@/types/auth';

export default function AgendaTabScreen() {
  const { user } = useAuth();
  const { alunoId: routeAlunoId } = useLocalSearchParams<{ alunoId?: string }>();
  const { students, loading, error, reload } = useStudents();
  const [alunoId, setAlunoId] = useState<string | null>(null);

  useEffect(() => {
    if (routeAlunoId) setAlunoId(routeAlunoId);
  }, [routeAlunoId]);

  useEffect(() => {
    if (students.length === 0) return;
    if (!alunoId || !students.some((student) => student.id === alunoId)) setAlunoId(students[0].id);
  }, [alunoId, students]);

  if (!can(user?.role, 'agenda:view')) return <UnauthorizedState />;

  const selected = students.find((student) => student.id === alunoId) ?? null;
  const isResponsavel = user?.role === 'responsavel';

  return (
    <Screen
      header={
        <PageHeader
          title="Agenda"
          subtitle={selected ? [selected.nome, selected.turmaNome].filter(Boolean).join(' • ') : 'Rotina semanal'}
        />
      }>
      {loading && students.length === 0 ? (
        <LoadingState rows={3} label="Carregando agenda" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : students.length === 0 ? (
        <EmptyState
          icon="students"
          title={isResponsavel ? 'Nenhuma criança vinculada' : 'Nenhum aluno vinculado'}
          description={
            isResponsavel
              ? 'Quando a escola vincular uma criança à sua conta, a agenda aparecerá aqui.'
              : 'Quando houver alunos vinculados ao seu perfil, você poderá acompanhar a agenda deles aqui.'
          }
        />
      ) : (
        <>
          {students.length > 1 ? (
            <Select
              label={isResponsavel ? 'Criança' : 'Aluno'}
              value={alunoId}
              onChange={setAlunoId}
              options={students.map((student) => ({
                value: student.id,
                label: student.nome,
                description: student.turmaNome ?? 'Sem turma',
              }))}
            />
          ) : null}
          {selected ? <AgendaPanel key={selected.id} alunoId={selected.id} context={selected.turmaNome} /> : null}
        </>
      )}
    </Screen>
  );
}
