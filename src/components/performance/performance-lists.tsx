import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar, Badge, Card, IconContainer, ListItem } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { attendanceStatus, count, formatRate, MIN_ATTENDANCE_RATE, studentRate } from '@/lib/performance';
import type { AttentionItem, PerformanceByClass, PerformanceByStudent } from '@/types/performance';

/** Linha de turma com frequência consolidada (soma das chamadas da turma). */
export function ClassPerformanceItem({ item, onPress }: { item: PerformanceByClass; onPress?: () => void }) {
  const status = attendanceStatus(item.attendanceRate);
  return (
    <ListItem
      title={item.turmaNome}
      subtitle={`${count(item.studentsCount, 'aluno')} • ${count(item.chamadas, 'chamada')}`}
      meta={`${count(item.recordsCount, 'registro')} • ${count(item.activitiesCount, 'atividade')}`}
      leading={<IconContainer icon="classes" tone="purple" />}
      trailing={<Badge label={`Frequência ${formatRate(item.attendanceRate)}`} tone={status.tone} />}
      onPress={onPress}
    />
  );
}

/** Linha de aluno — lista sempre em ordem alfabética, nunca ranking. */
export function StudentPerformanceItem({ row, onPress }: { row: PerformanceByStudent; onPress?: () => void }) {
  const rate = studentRate(row);
  const status = attendanceStatus(rate);
  return (
    <ListItem
      title={row.alunoNome}
      subtitle={`${count(row.presencas + row.ausencias, 'chamada')} • ${count(row.registros, 'registro')}`}
      leading={<Avatar name={row.alunoNome} size="small" />}
      trailing={<Badge label={formatRate(rate)} tone={status.tone} />}
      onPress={onPress}
    />
  );
}

/**
 * Alunos com frequência abaixo do mínimo legal (75%). Mostra o dado objetivo,
 * sem rotular desempenho.
 */
export function AttentionList({ items, onPress }: { items: AttentionItem[]; onPress: (alunoId: string) => void }) {
  return (
    <Card style={styles.attention}>
      <View style={styles.attentionHeader}>
        <IconContainer icon="alert" tone="peach" size="small" />
        <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
          Frequência abaixo de {MIN_ATTENDANCE_RATE}% no período (mínimo previsto na LDB).
        </ThemedText>
      </View>
      {items.map(({ student, attendanceRate }) => (
        <ListItem
          key={student.alunoId}
          appearance="plain"
          title={student.alunoNome}
          subtitle={`Frequência ${formatRate(attendanceRate)} • ${count(student.ausencias, 'ausencia')} em ${count(student.presencas + student.ausencias, 'chamada')}`}
          meta={student.turmaNome ?? undefined}
          leading={<Avatar name={student.alunoNome} size="small" />}
          onPress={() => onPress(student.alunoId)}
        />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  attention: { gap: Spacing.one },
  attentionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingBottom: Spacing.two },
  flex: { flex: 1 },
});
