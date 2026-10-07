import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Avatar,
  EmptyState,
  ErrorState,
  ListItem,
  LoadingState,
  PageHeader,
  Screen,
  SearchInput,
  UnauthorizedState,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { TurmaActions } from '@/components/turma-actions';
import { useAuth } from '@/contexts/auth-context';
import { listAlunosByTurma, listTurmas } from '@/services/school-service';
import { canAccessProfessorArea } from '@/types/auth';
import type { Aluno, Turma } from '@/types/school';

export default function ProfessorTurmaStudentsScreen() {
  const { turmaId: routeTurmaId } = useLocalSearchParams<{ turmaId: string | string[] }>();
  const turmaId = Array.isArray(routeTurmaId) ? routeTurmaId[0] : routeTurmaId;
  const { user } = useAuth();
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!turmaId) return;

    async function loadStudents() {
      try {
        setLoading(true);
        setError(null);
        const turmas = await listTurmas();
        const selectedTurma = turmas.find((item) => item.id === turmaId) ?? null;
        setTurma(selectedTurma);
        if (!selectedTurma) throw new Error('Turma não encontrada ou indisponível.');
        const nextAlunos = await listAlunosByTurma(turmaId);
        setAlunos(nextAlunos);
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os alunos da turma.');
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, [turmaId, reloadKey]);

  const filteredAlunos = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    if (!searchValue) return alunos;
    return alunos.filter((aluno) => aluno.nome.toLowerCase().includes(searchValue));
  }, [alunos, search]);

  if (!user || !canAccessProfessorArea(user.role)) return <UnauthorizedState />;

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={
        <PageHeader
          title={turma?.nome ?? 'Turma'}
          subtitle={loading ? 'Carregando...' : `${alunos.length} ${alunos.length === 1 ? 'aluno' : 'alunos'}`}
          showBack
          backFallback="/professor/turmas">
          {alunos.length > 0 ? <SearchInput value={search} onChangeText={setSearch} placeholder="Buscar aluno..." /> : null}
        </PageHeader>
      }>
      {turmaId ? <TurmaActions turmaId={turmaId} /> : null}

      {loading ? (
        <LoadingState rows={4} label="Carregando alunos" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : filteredAlunos.length === 0 ? (
        <EmptyState
          icon="students"
          tone="green"
          title="Nenhum aluno encontrado"
          description={alunos.length === 0 ? 'Nenhum aluno está vinculado a esta turma no momento.' : 'Tente buscar por outro nome.'}
        />
      ) : (
        <View style={styles.list}>
          {filteredAlunos.map((aluno) => (
            <ListItem
              key={aluno.id}
              title={aluno.nome}
              subtitle="Agenda e acompanhamento"
              leading={<Avatar name={aluno.nome} />}
              onPress={() => router.push(`/alunos/${aluno.id}` as Href)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
});
