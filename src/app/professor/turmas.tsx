import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  EmptyState,
  ErrorState,
  IconContainer,
  ListItem,
  LoadingState,
  PageHeader,
  Screen,
  UnauthorizedState,
} from '@/components/ui';
import { Spacing, type Tone } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { getSupabase } from '@/lib/supabase';
import { listProfessorApoioAlunos, listProfessorTurmas, listTurmas } from '@/services/school-service';
import { canAccessProfessorArea } from '@/types/auth';
import type { Turma } from '@/types/school';

const tileTones: Tone[] = ['blue', 'purple', 'green', 'peach', 'yellow', 'pink'];

export default function ProfessorTurmasScreen() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function loadTurmas() {
      try {
        setLoading(true);
        setError(null);

        const allTurmas = await listTurmas();
        if (currentUser.role === 'professor') {
          const turmaIds = await listProfessorTurmas(currentUser.id);
          setTurmas(allTurmas.filter((turma) => turmaIds.includes(turma.id)));
          return;
        }

        const alunoIds = await listProfessorApoioAlunos(currentUser.id);
        if (alunoIds.length === 0) {
          setTurmas([]);
          return;
        }

        const { data, error: alunoError } = await getSupabase()
          .from('alunos')
          .select('turma_id')
          .in('id', alunoIds);

        if (alunoError) {
          throw new Error(alunoError.message || 'Não foi possível carregar as turmas vinculadas.');
        }

        const turmaIds = Array.from(new Set((data ?? [])
          .map((row) => row.turma_id)
          .filter((turmaId): turmaId is string => Boolean(turmaId))));

        setTurmas(allTurmas.filter((turma) => turmaIds.includes(turma.id)));
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as turmas.');
      } finally {
        setLoading(false);
      }
    }

    loadTurmas();
  }, [user, reloadKey]);

  if (!user || !canAccessProfessorArea(user.role)) return <UnauthorizedState />;

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={<PageHeader title="Minhas turmas" subtitle="Turmas vinculadas ao seu perfil" showBack />}>
      {loading ? (
        <LoadingState rows={3} label="Carregando turmas" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : turmas.length === 0 ? (
        <EmptyState
          icon="classes"
          tone="purple"
          title="Nenhuma turma encontrada"
          description="Você ainda não possui turmas associadas ao seu perfil. A Direção faz esse vínculo."
        />
      ) : (
        <View style={styles.list}>
          {turmas.map((turma, index) => (
            <ListItem
              key={turma.id}
              title={turma.nome}
              subtitle="Ver alunos e acompanhamento"
              leading={<IconContainer icon="classes" tone={tileTones[index % tileTones.length]} />}
              onPress={() => router.push(`/professor/turmas/${turma.id}` as Href)}
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
