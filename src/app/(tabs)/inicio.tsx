import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AgendaItemCard } from '@/components/agenda/agenda-item-card';
import { sortAgendaItems } from '@/components/agenda/agenda-config';
import { DaySummaryCard, ShortcutGrid, type Shortcut, type SummaryMetric } from '@/components/home/home-widgets';
import { ThemedText } from '@/components/themed-text';
import { Avatar, EmptyState, ErrorState, LoadingState, Screen, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAgenda } from '@/contexts/agenda-context';
import { useAuth } from '@/contexts/auth-context';
import { useStudents } from '@/hooks/use-students';
import { getWeekDays, greetingForNow, todayKey } from '@/lib/dates';
import { canAccessProfessorArea, canManageTurmas, canManageUsers, roleLabel } from '@/types/auth';

const roleIntro = {
  direcao: 'Acompanhe a escola e mantenha os cadastros em dia.',
  professor: 'Que bom te ver por aqui! Confira a rotina das suas turmas.',
  apoio: 'Que bom te ver por aqui! Confira a rotina dos seus alunos.',
  responsavel: 'Que bom te ver por aqui! Acompanhe a rotina escolar.',
} as const;

export default function InicioScreen() {
  const { user } = useAuth();
  const { items } = useAgenda();
  const { students, turmas, loading, error, reload } = useStudents();

  const studentById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const accessibleItems = useMemo(
    () => sortAgendaItems(items.filter((item) => studentById.has(item.alunoId))),
    [items, studentById],
  );
  const today = todayKey();
  const todayItems = accessibleItems.filter((item) => item.data === today);
  const weekDays = getWeekDays(new Date());
  const weekItems = accessibleItems.filter((item) => weekDays.includes(item.data));
  const upcoming = accessibleItems.filter((item) => item.data >= today).slice(0, 3);

  if (!user) return null;
  const role = user.role;
  const firstName = user.nome.split(' ')[0];
  const isResponsavel = role === 'responsavel';

  const metrics: SummaryMetric[] = isResponsavel
    ? [
        { label: 'Atividades hoje', value: todayItems.length, icon: 'calendar', tone: 'blue' },
        { label: 'Na semana', value: weekItems.length, icon: 'activity', tone: 'yellow' },
        { label: students.length === 1 ? 'Criança' : 'Crianças', value: students.length, icon: 'student', tone: 'green' },
      ]
    : [
        { label: 'Atividades hoje', value: todayItems.length, icon: 'calendar', tone: 'blue' },
        { label: 'Alunos', value: students.length, icon: 'students', tone: 'green' },
        { label: 'Turmas', value: turmas.length, icon: 'classes', tone: 'purple' },
      ];

  const shortcuts: Shortcut[] = [
    { label: 'Agenda', description: 'Rotina e atividades', icon: 'calendar', tone: 'blue', onPress: () => router.navigate('/agenda') },
    {
      label: isResponsavel ? 'Meus filhos' : 'Alunos',
      description: isResponsavel ? 'Informações e acompanhamento' : 'Lista e acompanhamento',
      icon: 'students',
      tone: 'green',
      onPress: () => router.navigate('/alunos'),
    },
  ];
  if (canAccessProfessorArea(role)) {
    shortcuts.push({ label: 'Turmas', description: 'Suas turmas vinculadas', icon: 'classes', tone: 'purple', onPress: () => router.push('/professor/turmas' as Href) });
  }
  if (canManageTurmas(role)) {
    shortcuts.push({ label: 'Turmas', description: 'Turmas e cadastro de alunos', icon: 'classes', tone: 'purple', onPress: () => router.push('/direcao/turmas' as Href) });
  }
  if (canManageUsers(role)) {
    shortcuts.push({ label: 'Usuários', description: 'Professores e responsáveis', icon: 'users', tone: 'peach', onPress: () => router.push('/direcao/usuarios' as Href) });
  } else {
    shortcuts.push({ label: 'Comunicação', description: 'Mensagens e comunicados', icon: 'megaphone', tone: 'peach', onPress: () => router.navigate('/comunicacao') });
  }
  if (isResponsavel) {
    shortcuts.push({ label: 'Perfil', description: 'Seus dados e senha', icon: 'profile', tone: 'yellow', onPress: () => router.navigate('/perfil') });
  }

  return (
    <Screen onRefresh={reload} refreshing={loading && students.length > 0}>
      <Animated.View entering={FadeInDown.duration(360)} style={styles.greeting}>
        <View style={styles.greetingCopy}>
          <ThemedText type="small" themeColor="textMuted">{roleLabel(role)}</ThemedText>
          <ThemedText type="display">Olá, {firstName}! 👋</ThemedText>
          <ThemedText themeColor="textSecondary">{greetingForNow()}! {roleIntro[role]}</ThemedText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir meu perfil" onPress={() => router.navigate('/perfil')}>
          <Avatar name={user.nome} />
        </Pressable>
      </Animated.View>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <DaySummaryCard title="Resumo do dia" metrics={metrics} loading={loading} />
      )}

      <View style={styles.section}>
        <SectionHeader title="Acesso rápido" />
        <ShortcutGrid shortcuts={shortcuts} />
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Próximas atividades"
          actionLabel={upcoming.length > 0 ? 'Ver agenda' : undefined}
          onActionPress={() => router.navigate('/agenda')}
        />
        {loading && students.length === 0 ? (
          <LoadingState rows={2} label="Carregando atividades" />
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon="calendar"
            tone="yellow"
            title="Nenhuma atividade programada"
            description={
              students.length === 0
                ? 'Quando houver alunos vinculados ao seu perfil, as atividades aparecerão aqui.'
                : 'As próximas atividades da agenda aparecerão aqui.'
            }
          />
        ) : (
          <View style={styles.list}>
            {upcoming.map((item) => {
              const student = studentById.get(item.alunoId);
              return (
                <AgendaItemCard
                  key={item.id}
                  item={item}
                  timeline={false}
                  context={[student?.nome, item.data === today ? 'Hoje' : item.data.split('-').reverse().slice(0, 2).join('/')]
                    .filter(Boolean)
                    .join(' • ')}
                  onPress={() => router.navigate({ pathname: '/agenda', params: { alunoId: item.alunoId } })}
                />
              );
            })}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  greetingCopy: { flex: 1, gap: Spacing.one },
  section: { gap: Spacing.three },
  list: { gap: Spacing.three },
});
