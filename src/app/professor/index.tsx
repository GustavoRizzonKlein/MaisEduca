import { Redirect, router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/surface-card';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { mockStudents } from '@/mocks/teacher';
import { canAccessProfessorArea, homeRouteForRole, roleLabel } from '@/types/auth';

export default function ProfessorHomeScreen() {
  const { user, isLoading, logout } = useAuth();
  const theme = useTheme();
  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (!canAccessProfessorArea(user.role)) return <Redirect href={homeRouteForRole(user.role)} />;

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
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
            <ThemedText themeColor="textSecondary">Aqui está um resumo do acompanhamento de hoje.</ThemedText>
          </SurfaceCard>
          <View style={styles.statsRow}>
            <Stat value={`${mockStudents.length}`} label="Alunos" color={theme.information} tone="informationSoft" />
            <Stat value="4" label="Atividades" color={theme.learning} tone="learningSoft" />
            <Stat value="2" label="Avisos" color={theme.attention} tone="attentionSoft" />
          </View>
          <View style={styles.cards}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Meus alunos</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Acompanhamento</ThemedText>
            </View>
            {mockStudents.map((student) => (
              <Pressable key={student.id} onPress={() => router.push(`/professor/agenda/${student.id}` as Href)} style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement }, pressed && styles.cardPressed]}>
                <View style={[styles.studentAvatar, { backgroundColor: theme.learningSoft }]}><ThemedText style={[styles.studentAvatarText, { color: theme.learning }]}>{student.name.charAt(0)}</ThemedText></View>
                <View style={styles.cardCopy}>
                  <ThemedText type="smallBold">{student.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{student.className}</ThemedText>
                  <ThemedText type="small" style={[styles.cardAction, { color: theme.brand }]}>Abrir agenda  ›</ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
          <PrimaryButton title="Sair" onPress={logout} variant="outline" />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Stat({
  value,
  label,
  color,
  tone,
}: {
  value: string;
  label: string;
  color: string;
  tone: 'informationSoft' | 'learningSoft' | 'attentionSoft';
}) {
  return (
    <ThemedView type="backgroundElement" style={[styles.statCard, { borderColor: BrandColors.border }]}>
      <View style={[styles.statAccent, { backgroundColor: toneColor(tone) }]} />
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
    </ThemedView>
  );
}

function toneColor(tone: 'informationSoft' | 'learningSoft' | 'attentionSoft') {
  return BrandColors[tone];
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start' },
  welcomeCard: { marginBottom: Spacing.one },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  greetingCopy: { flex: 1 },
  title: { marginTop: Spacing.one, marginBottom: Spacing.one, fontSize: 28, lineHeight: 36 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: BrandColors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BrandColors.brand, fontSize: 20, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.four },
  statCard: { flex: 1, borderRadius: Radius.medium, padding: Spacing.three, borderWidth: 1, ...Shadows.card },
  statAccent: { width: 8, height: 8, borderRadius: 4 },
  statValue: { fontSize: 26, lineHeight: 32, fontWeight: '800', marginBottom: Spacing.one },
  cards: { gap: Spacing.two, marginTop: Spacing.five, marginBottom: Spacing.five },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.one },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginTop: 0, marginBottom: 0 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.three, backgroundColor: BrandColors.backgroundElement, ...Shadows.card },
  cardPressed: { opacity: 0.88 },
  cardCopy: { flex: 1, gap: Spacing.one },
  cardAction: { color: BrandColors.brand, fontWeight: '700', marginTop: Spacing.one },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: BrandColors.learningSoft, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: BrandColors.learning, fontSize: 18, fontWeight: '800' },
});
