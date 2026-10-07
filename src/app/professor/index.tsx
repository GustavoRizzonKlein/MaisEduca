import { Redirect, router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, type AppIconName } from '@/components/app-icon';
import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/surface-card';
import { useAuth } from '@/contexts/auth-context';
import { useAgenda } from '@/contexts/agenda-context';
import { useTheme } from '@/hooks/use-theme';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { getSupabase } from '@/lib/supabase';
import { listAlunosByTurma, listProfessorApoioAlunos, listProfessorTurmas, listTurmas } from '@/services/school-service';
import { canAccessProfessorArea, homeRouteForRole, roleLabel } from '@/types/auth';
import type { Turma } from '@/types/school';

export default function ProfessorHomeScreen() {
  const { user, isLoading, logout } = useAuth();
  const { items } = useAgenda();
  const theme = useTheme();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentTotal, setStudentTotal] = useState(0);
  const [agendaTotal, setAgendaTotal] = useState(0);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function loadOverview() {
      try {
        setLoading(true);
        setError(null);

        const allTurmas = await listTurmas();
        let selectedTurmas: Turma[] = [];
        const studentIds = new Set<string>();

        if (currentUser.role === 'professor') {
          const turmaIds = await listProfessorTurmas(currentUser.id);
          selectedTurmas = allTurmas.filter((turma) => turmaIds.includes(turma.id));
        } else {
          const alunoIds = await listProfessorApoioAlunos(currentUser.id);
          if (alunoIds.length > 0) {
            const { data, error: alunoError } = await getSupabase()
              .from('alunos')
              .select('id, turma_id')
              .in('id', alunoIds);

            if (alunoError) {
              throw new Error(alunoError.message || 'Não foi possível carregar os alunos vinculados.');
            }

            const turmaIds = Array.from(new Set((data ?? [])
              .map((row) => row.turma_id)
              .filter((turmaId): turmaId is string => Boolean(turmaId))));

            selectedTurmas = allTurmas.filter((turma) => turmaIds.includes(turma.id));

            (data ?? []).forEach((row) => {
              if (row.id) studentIds.add(row.id);
            });
          }
        }

        if (selectedTurmas.length > 0) {
          const alunoLists = await Promise.all(selectedTurmas.map(async (turma) => listAlunosByTurma(turma.id)));
          alunoLists.forEach((alunos) => {
            alunos.forEach((aluno) => studentIds.add(aluno.id));
          });
        }

        setTurmas(selectedTurmas);
        setStudentTotal(studentIds.size);
        setAgendaTotal(items.filter((item) => studentIds.has(item.alunoId)).length);
      } catch (loadError: unknown) {
        const message = loadError instanceof Error ? loadError.message : 'Não foi possível carregar sua visão geral.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, [items, user]);

  const summaryCards = [
    { label: 'Turmas', value: String(turmas.length), accent: theme.informationSoft, color: theme.information },
    { label: 'Alunos', value: String(studentTotal || 0), accent: theme.successSoft, color: theme.success },
    { label: 'Agenda', value: String(agendaTotal || 0), accent: theme.learningSoft, color: theme.learning },
  ];

  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (!canAccessProfessorArea(user.role)) return <Redirect href={homeRouteForRole(user.role)} />;

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SurfaceCard style={styles.welcomeCard}>
            <View style={styles.headerRow}>
              <View style={styles.greetingCopy}>
                <ThemedText type="small" themeColor="textSecondary">Área do {roleLabel(user.role).toLowerCase()}</ThemedText>
                <ThemedText type="subtitle" style={styles.title}>Olá, {user.nome}!</ThemedText>
              </View>
              <View style={[styles.avatar, { backgroundColor: theme.brandSoft }]}>
                <ThemedText style={[styles.avatarText, { color: theme.brand }]}>{user.nome.charAt(0)}</ThemedText>
              </View>
            </View>
            <ThemedText themeColor="textSecondary">Acompanhe suas turmas, alunos e atividades do dia.</ThemedText>
          </SurfaceCard>

          <View style={styles.statsRow}>
            {summaryCards.map((card) => (
              <View key={card.label} style={[styles.statCard, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.statIcon, { backgroundColor: card.accent }]}>
                  <AppIcon name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} color={card.color} size={18} />
                </View>
                <ThemedText style={[styles.statValue, { color: card.color }]}>{card.value}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{card.label}</ThemedText>
              </View>
            ))}
          </View>

          {error ? (
            <SurfaceCard style={styles.errorCard}>
              <ThemedText style={[styles.errorText, { color: theme.danger }]}>{error}</ThemedText>
            </SurfaceCard>
          ) : null}

          <View style={styles.cards}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Minhas turmas</ThemedText>
              <Pressable onPress={() => router.push('/professor/turmas' as Href)}>
                <ThemedText style={[styles.inlineLink, { color: theme.brand }]}>Ver todas</ThemedText>
              </Pressable>
            </View>

            {loading ? (
              <SurfaceCard style={styles.emptyCard}>
                <ThemedText themeColor="textSecondary">Carregando suas turmas...</ThemedText>
              </SurfaceCard>
            ) : turmas.length === 0 ? (
              <SurfaceCard style={styles.emptyCard}>
                <ThemedText type="subtitle">Nenhuma turma encontrada.</ThemedText>
                <ThemedText themeColor="textSecondary">Você ainda não possui turmas vinculadas a este perfil.</ThemedText>
              </SurfaceCard>
            ) : (
              turmas.map((turma) => (
                <Pressable
                  key={turma.id}
                  onPress={() => router.push(`/professor/turmas/${turma.id}` as Href)}
                  style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, pressed && styles.cardPressed]}
                >
                  <View style={[styles.iconBox, { backgroundColor: theme.informationSoft }]}>
                    <AppIcon name={{ ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' }} color={theme.information} size={22} />
                  </View>
                  <View style={styles.cardCopy}>
                    <ThemedText type="smallBold">{turma.nome}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">Acesso ao acompanhamento da turma</ThemedText>
                    <ThemedText type="small" style={[styles.cardAction, { color: theme.brand }]}>Abrir turma  ›</ThemedText>
                  </View>
                </Pressable>
              ))
            )}
          </View>

          <View style={styles.cards}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Ações rápidas</ThemedText>
            </View>
            <View style={styles.actionGrid}>
              <ActionTile label="Agenda" route="/professor/turmas" icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} accent={theme.informationSoft} color={theme.information} />
              <ActionTile label="Alunos" route="/professor/turmas" icon={{ ios: 'person.2.fill', android: 'groups', web: 'groups' }} accent={theme.successSoft} color={theme.success} />
            </View>
          </View>

          <PrimaryButton title="Sair" onPress={logout} variant="outline" />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ActionTile({
  label,
  route,
  icon,
  accent,
  color,
}: {
  label: string;
  route: string;
  icon: AppIconName;
  accent: string;
  color: string;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => router.push(route as Href)} style={({ pressed }) => [styles.actionTile, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, pressed && styles.cardPressed]}>
      <View style={[styles.actionIcon, { backgroundColor: accent }]}>
        <AppIcon name={icon} color={color} size={20} />
      </View>
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start' },
  welcomeCard: { marginBottom: Spacing.one },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  greetingCopy: { flex: 1 },
  title: { marginTop: Spacing.one, marginBottom: Spacing.one, fontSize: 28, lineHeight: 36 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.four },
  statCard: { flex: 1, borderRadius: Radius.medium, padding: Spacing.three, borderWidth: 1, ...Shadows.card },
  statIcon: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  statValue: { fontSize: 24, lineHeight: 30, fontWeight: '800', marginBottom: Spacing.one },
  cards: { gap: Spacing.two, marginTop: Spacing.five, marginBottom: Spacing.five },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.one },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginTop: 0, marginBottom: 0 },
  inlineLink: { fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.three, borderWidth: 1, ...Shadows.card },
  cardPressed: { opacity: 0.88 },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, gap: Spacing.one },
  cardAction: { fontWeight: '700', marginTop: Spacing.one },
  actionGrid: { flexDirection: 'row', gap: Spacing.two },
  actionTile: { flex: 1, borderRadius: Radius.medium, padding: Spacing.three, borderWidth: 1, alignItems: 'center', gap: Spacing.one, ...Shadows.card },
  actionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyCard: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.backgroundElement,
    gap: Spacing.one,
  },
  errorCard: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  errorText: {
    fontWeight: '600',
  },
});
