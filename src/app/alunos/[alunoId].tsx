import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AgendaPanel } from '@/components/agenda/agenda-panel';
import { ThemedText } from '@/components/themed-text';
import {
  Avatar,
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Screen,
  SegmentedControl,
  UnauthorizedState,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useStudents } from '@/hooks/use-students';
import { listManagedUsers } from '@/services/manage-users-service';
import { listResponsaveisDosAlunos } from '@/services/school-service';
import { canManageAlunos, canManageResponsaveis, canViewAcompanhamento } from '@/types/auth';

type Section = 'agenda' | 'presenca' | 'registros';

export default function AlunoDetailScreen() {
  const { alunoId: routeAlunoId } = useLocalSearchParams<{ alunoId: string | string[] }>();
  const alunoId = Array.isArray(routeAlunoId) ? routeAlunoId[0] : routeAlunoId;
  const { user } = useAuth();
  const { students, loading, error, reload } = useStudents();
  const [section, setSection] = useState<Section>('agenda');
  const [responsavelNome, setResponsavelNome] = useState<string | null>(null);

  const student = students.find((candidate) => candidate.id === alunoId) ?? null;
  const role = user?.role;
  const canSeeResponsavel = role ? canManageResponsaveis(role) : false;

  useEffect(() => {
    if (!student || !canSeeResponsavel) return;
    let active = true;
    Promise.all([listResponsaveisDosAlunos([student.id]), listManagedUsers()])
      .then(([associations, users]) => {
        if (!active) return;
        const responsavelId = associations[0]?.responsavel_id;
        setResponsavelNome(users.find((profile) => profile.id === responsavelId)?.nome ?? null);
      })
      .catch(() => {
        if (active) setResponsavelNome(null);
      });
    return () => {
      active = false;
    };
  }, [student, canSeeResponsavel]);

  if (!role || !canViewAcompanhamento(role)) return <UnauthorizedState />;

  if (loading && students.length === 0) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']} header={<PageHeader title="Aluno" showBack backFallback="/alunos" />}>
        <LoadingState rows={3} label="Carregando aluno" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']} header={<PageHeader title="Aluno" showBack backFallback="/alunos" />}>
        <ErrorState message={error} onRetry={reload} />
      </Screen>
    );
  }

  // O RLS só devolve alunos que o perfil pode acessar.
  if (!student) {
    return (
      <UnauthorizedState
        title="Aluno indisponível"
        message={'Este aluno não existe ou não está vinculado ao seu perfil.\nEntre em contato com a direção caso precise de acesso.'}
      />
    );
  }

  const responsavelLabel = role === 'responsavel'
    ? 'Responsável: você'
    : canSeeResponsavel && responsavelNome
      ? `Responsável: ${responsavelNome}`
      : null;

  return (
    <Screen
      edges={['top', 'left', 'right', 'bottom']}
      header={
        <PageHeader
          title={student.nome}
          showBack
          backFallback="/alunos"
          action={
            canManageAlunos(role) && student.turma_id
              ? {
                  icon: 'edit',
                  accessibilityLabel: 'Editar aluno na turma',
                  onPress: () => router.push(`/direcao/turmas/${student.turma_id}` as Href),
                }
              : undefined
          }
        />
      }>
      <View style={styles.identity}>
        <Avatar name={student.nome} size="large" />
        <ThemedText type="title" style={styles.center}>{student.nome}</ThemedText>
        <ThemedText themeColor="textSecondary">{student.turmaNome ?? 'Sem turma vinculada'}</ThemedText>
        <View style={styles.badges}>
          {student.turmaNome ? <Badge label={student.turmaNome} tone="purple" icon="classes" /> : null}
          {responsavelLabel ? <Badge label={responsavelLabel} tone="green" icon="profile" /> : null}
        </View>
      </View>

      <SegmentedControl
        value={section}
        onChange={setSection}
        options={[
          { value: 'agenda', label: 'Agenda' },
          { value: 'presenca', label: 'Presença' },
          { value: 'registros', label: 'Registros' },
        ]}
      />

      {section === 'agenda' ? <AgendaPanel alunoId={student.id} context={student.turmaNome} /> : null}
      {section === 'presenca' ? (
        <EmptyState
          icon="attendance"
          tone="green"
          badge="Em breve"
          title="Presença ainda não disponível"
          description="O registro de presença e os avisos de ausência ainda não foram implementados no sistema."
        />
      ) : null}
      {section === 'registros' ? (
        <EmptyState
          icon="notes"
          tone="yellow"
          badge="Em breve"
          title="Registros ainda não disponíveis"
          description="As observações de acompanhamento (avanços, dificuldades e atividades) ainda não são salvas no sistema."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: Spacing.one },
  center: { textAlign: 'center', marginTop: Spacing.two },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.two, marginTop: Spacing.two },
});
