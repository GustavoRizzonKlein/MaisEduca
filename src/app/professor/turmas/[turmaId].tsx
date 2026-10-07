import { Redirect, router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/surface-card';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { listAlunosByTurma, listTurmas } from '@/services/school-service';
import { canAccessProfessorArea, homeRouteForRole } from '@/types/auth';
import type { Aluno, Turma } from '@/types/school';

export default function ProfessorTurmaStudentsScreen() {
  const { turmaId: routeTurmaId } = useLocalSearchParams<{ turmaId: string | string[] }>();
  const turmaId = Array.isArray(routeTurmaId) ? routeTurmaId[0] : routeTurmaId;
  const { user, isLoading } = useAuth();
  const theme = useTheme();
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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
  }, [turmaId]);

  const filteredAlunos = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    if (!searchValue) return alunos;
    return alunos.filter((aluno) => aluno.nome.toLowerCase().includes(searchValue));
  }, [alunos, search]);

  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (!canAccessProfessorArea(user.role)) return <Redirect href={homeRouteForRole(user.role)} />;

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText style={[styles.backButtonText, { color: theme.text }]}>‹</ThemedText>
            </Pressable>
            <View style={styles.headerText}>
              <ThemedText type="small" themeColor="textSecondary">Turma</ThemedText>
              <ThemedText type="subtitle" style={styles.title}>{turma?.nome ?? 'Carregando turma...'}</ThemedText>
            </View>
          </View>

          <SurfaceCard style={styles.summaryCard}>
            <View style={styles.summaryTitle}>
              <ThemedText type="small" themeColor="textSecondary">Alunos</ThemedText>
              <ThemedText type="smallBold">{alunos.length} cadastrados</ThemedText>
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar aluno..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            />
          </SurfaceCard>

          {error ? (
            <SurfaceCard style={styles.errorCard}>
              <ThemedText style={[styles.errorText, { color: theme.danger }]}>{error}</ThemedText>
            </SurfaceCard>
          ) : null}

          {loading ? (
            <SurfaceCard style={styles.emptyCard}>
              <ThemedText themeColor="textSecondary">Carregando alunos...</ThemedText>
            </SurfaceCard>
          ) : filteredAlunos.length === 0 ? (
            <SurfaceCard style={styles.emptyCard}>
              <ThemedText type="subtitle">Nenhum aluno encontrado.</ThemedText>
              <ThemedText themeColor="textSecondary">Nenhum aluno está vinculado a esta turma no momento.</ThemedText>
            </SurfaceCard>
          ) : (
            <View style={styles.list}>
              {filteredAlunos.map((aluno) => (
                <Pressable
                  key={aluno.id}
                  onPress={() => router.push(`/professor/agenda/${aluno.id}` as Href)}
                  style={({ pressed }) => [styles.studentCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, pressed && styles.cardPressed]}
                >
                  <View style={[styles.avatar, { backgroundColor: theme.learningSoft }]}>
                    <ThemedText style={[styles.avatarText, { color: theme.learning }]}>{aluno.nome.charAt(0)}</ThemedText>
                  </View>
                  <View style={styles.cardCopy}>
                    <ThemedText type="smallBold">{aluno.nome}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">Acompanhar agenda e registros</ThemedText>
                    <ThemedText type="small" style={[styles.cardAction, { color: theme.brand }]}>Abrir agenda  ›</ThemedText>
                  </View>
                  <View style={[styles.summaryBadge, { backgroundColor: theme.successSoft }]}>
                    <AppIcon name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} color={theme.success} size={16} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <PrimaryButton title="Voltar para turmas" onPress={() => router.replace('/professor/turmas' as Href)} variant="outline" />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { fontSize: 28, lineHeight: 30, fontWeight: '700' },
  headerText: { flex: 1 },
  title: { marginTop: Spacing.one },
  summaryCard: { gap: Spacing.two, padding: Spacing.three, marginBottom: Spacing.three },
  summaryTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchInput: {
    minHeight: 48,
    borderRadius: Radius.medium,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  list: { gap: Spacing.two, marginBottom: Spacing.five },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    ...Shadows.card,
  },
  cardPressed: { opacity: 0.88 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  cardCopy: { flex: 1, gap: Spacing.one },
  cardAction: { fontWeight: '700', marginTop: Spacing.one },
  summaryBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyCard: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.backgroundElement,
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  errorCard: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.backgroundElement,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontWeight: '600',
  },
});
