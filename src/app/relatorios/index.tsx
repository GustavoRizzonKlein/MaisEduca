import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { PeriodFilter } from '@/components/performance/period-filter';
import { ThemedText } from '@/components/themed-text';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconContainer,
  LoadingState,
  PageHeader,
  Screen,
  Select,
  UnauthorizedState,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { usePeriod } from '@/hooks/use-period';
import { useStudents } from '@/hooks/use-students';
import { can } from '@/types/auth';

export default function RelatoriosScreen() {
  const { user } = useAuth();
  const { period, setPeriod, periodParams } = usePeriod();
  const { students, turmas, loading, error, reload } = useStudents();
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [alunoId, setAlunoId] = useState<string | null>(null);

  if (!can(user?.role, 'desempenho:view')) return <UnauthorizedState />;
  const isResponsavel = user?.role === 'responsavel';

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={<PageHeader title="Relatórios" subtitle="Consolidados com os dados do período" showBack backFallback="/desempenho" />}>
      <PeriodFilter value={period} onChange={setPeriod} />
      {loading && students.length === 0 ? (
        <LoadingState rows={2} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : students.length === 0 ? (
        <EmptyState icon="notes" tone="purple" title="Ainda não existem dados suficientes para gerar relatórios" />
      ) : (
        <>
          {!isResponsavel ? (
            <Card style={styles.card}>
              <IconContainer icon="classes" tone="purple" />
              <ThemedText type="heading">Relatório da turma</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Frequência, atividades e registros de todos os alunos da turma.</ThemedText>
              <Select
                label="Turma"
                placeholder="Selecionar turma"
                value={turmaId}
                onChange={setTurmaId}
                options={turmas.map((turma) => ({ value: turma.id, label: turma.nome }))}
                emptyMessage="Nenhuma turma no seu escopo."
              />
              <Button
                title="Gerar relatório da turma"
                icon="chevronRight"
                disabled={!turmaId}
                onPress={() => turmaId && router.push({ pathname: '/relatorios/turma/[turmaId]', params: { turmaId, ...periodParams } })}
              />
            </Card>
          ) : null}
          <Card style={styles.card}>
            <IconContainer icon="student" tone="green" />
            <ThemedText type="heading">Relatório do aluno</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Acompanhamento individual: frequência, ausências e registros.</ThemedText>
            <Select
              label={isResponsavel ? 'Criança' : 'Aluno'}
              placeholder="Selecionar"
              value={alunoId}
              onChange={setAlunoId}
              options={students.map((student) => ({ value: student.id, label: student.nome, description: student.turmaNome ?? undefined }))}
            />
            <Button
              title="Gerar relatório do aluno"
              icon="chevronRight"
              disabled={!alunoId}
              onPress={() => alunoId && router.push({ pathname: '/relatorios/aluno/[alunoId]', params: { alunoId, ...periodParams } })}
            />
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two + 2 },
});
