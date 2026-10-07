import { Redirect, router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/surface-card';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { getSupabase } from '@/lib/supabase';
import { listProfessorApoioAlunos, listProfessorTurmas, listTurmas } from '@/services/school-service';
import { canAccessProfessorArea, homeRouteForRole } from '@/types/auth';
import type { Turma } from '@/types/school';

export default function ProfessorTurmasScreen() {
  const { user, isLoading, logout } = useAuth();
  const theme = useTheme();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [user]);

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
            <ThemedText type="subtitle" style={styles.title}>Minhas turmas</ThemedText>
          </View>

          {error ? (
            <SurfaceCard style={styles.errorCard}>
              <ThemedText style={[styles.errorText, { color: theme.danger }]}>{error}</ThemedText>
            </SurfaceCard>
          ) : null}

          {loading ? (
            <SurfaceCard style={styles.emptyCard}>
              <ThemedText themeColor="textSecondary">Carregando suas turmas...</ThemedText>
            </SurfaceCard>
          ) : turmas.length === 0 ? (
            <SurfaceCard style={styles.emptyCard}>
              <ThemedText type="subtitle">Nenhuma turma encontrada.</ThemedText>
              <ThemedText themeColor="textSecondary">Você ainda não possui turmas associadas ao seu perfil.</ThemedText>
            </SurfaceCard>
          ) : (
            <View style={styles.list}>
              {turmas.map((turma) => (
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
                    <ThemedText type="small" themeColor="textSecondary">Visualizar alunos e acompanhamento</ThemedText>
                    <ThemedText type="small" style={[styles.cardAction, { color: theme.brand }]}>Abrir turma  ›</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <PrimaryButton title="Sair" onPress={logout} variant="outline" />
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
  title: { fontSize: 22, lineHeight: 28 },
  list: { gap: Spacing.two, marginBottom: Spacing.five },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    ...Shadows.card,
  },
  cardPressed: { opacity: 0.88 },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, gap: Spacing.one },
  cardAction: { fontWeight: '700', marginTop: Spacing.one },
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
