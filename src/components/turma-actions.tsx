import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconContainer, ListItem } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { can } from '@/types/auth';

/** Atalhos da turma: chamada e desempenho (exibidos conforme permissão). */
export function TurmaActions({ turmaId }: { turmaId: string }) {
  const { user } = useAuth();
  const canTakeAttendance = can(user?.role, 'frequencia:edit');
  const canViewPerformance = can(user?.role, 'desempenho:view');
  if (!canTakeAttendance && !canViewPerformance) return null;

  return (
    <View style={styles.wrap}>
      {canTakeAttendance ? (
        <ListItem
          title="Fazer chamada"
          subtitle="Registrar presença do dia"
          leading={<IconContainer icon="attendance" tone="green" />}
          onPress={() => router.push({ pathname: '/chamada/[turmaId]', params: { turmaId } })}
        />
      ) : null}
      {canViewPerformance ? (
        <ListItem
          title="Desempenho da turma"
          subtitle="Frequência, atividades e registros"
          leading={<IconContainer icon="chart" tone="blue" />}
          onPress={() => router.push({ pathname: '/desempenho/turma/[turmaId]', params: { turmaId } })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
});
