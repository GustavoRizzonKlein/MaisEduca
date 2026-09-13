import { Redirect, router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { mockStudents } from '@/mocks/teacher';

const responsavelRoute: Href = '/responsavel' as Href;

export default function ProfessorHomeScreen() {
  const { user, isLoading, logout } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'professor') return <Redirect href={responsavelRoute} />;

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">Área do professor</ThemedText>
              <ThemedText type="subtitle" style={styles.title}>Olá, {user.nome}!</ThemedText>
            </View>
            <View style={styles.avatar}><ThemedText style={styles.avatarText}>{user.nome.charAt(0)}</ThemedText></View>
          </View>
          <ThemedText themeColor="textSecondary">Aqui está um resumo do acompanhamento de hoje.</ThemedText>
          <View style={styles.statsRow}>
            <Stat value={`${mockStudents.length}`} label="Alunos" color={BrandColors.brand} />
            <Stat value="4" label="Atividades" color={BrandColors.learning} />
            <Stat value="2" label="Avisos" color={BrandColors.attention} />
          </View>
          <View style={styles.cards}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Meus alunos</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Acompanhamento</ThemedText>
            </View>
            {mockStudents.map((student) => (
              <Pressable key={student.id} onPress={() => router.push(`/professor/agenda/${student.id}` as Href)} style={styles.card}>
                <View style={styles.studentAvatar}><ThemedText style={styles.studentAvatarText}>{student.name.charAt(0)}</ThemedText></View>
                <View style={styles.cardCopy}>
                  <ThemedText type="smallBold">{student.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{student.className}</ThemedText>
                  <ThemedText type="small" style={styles.cardAction}>Abrir agenda  ›</ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
          <PrimaryButton title="Sair" onPress={logout} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.statCard}>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { marginTop: Spacing.one, marginBottom: Spacing.one },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: BrandColors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BrandColors.brand, fontSize: 20, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.four },
  statCard: { flex: 1, borderRadius: Radius.medium, padding: Spacing.three, ...Shadows.card },
  statValue: { fontSize: 26, lineHeight: 32, fontWeight: '800', marginBottom: Spacing.one },
  cards: { gap: Spacing.two, marginTop: Spacing.five, marginBottom: Spacing.five },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.one },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginTop: 0, marginBottom: 0 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.three, backgroundColor: BrandColors.backgroundElement, ...Shadows.card },
  cardCopy: { flex: 1, gap: Spacing.one },
  cardAction: { color: BrandColors.brand, fontWeight: '700', marginTop: Spacing.one },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: BrandColors.learningSoft, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: BrandColors.learning, fontSize: 18, fontWeight: '800' },
});
