import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/surface-card';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { homeRouteForRole } from '@/types/auth';

export default function ResponsavelHomeScreen() {
  const { user, isLoading, logout } = useAuth();
  const theme = useTheme();
  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'responsavel') return <Redirect href={homeRouteForRole(user.role)} />;

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <SurfaceCard style={styles.welcomeCard}>
            <View style={styles.headerRow}>
              <View style={styles.greetingCopy}>
                <ThemedText type="small" themeColor="textSecondary">Área da família</ThemedText>
                <ThemedText type="subtitle" style={styles.title}>Olá, {user.nome}!</ThemedText>
              </View>
              <View style={[styles.avatar, { backgroundColor: theme.informationSoft }]}>
                <ThemedText style={[styles.avatarText, { color: theme.information }]}>{user.nome.charAt(0)}</ThemedText>
              </View>
            </View>
            <ThemedText themeColor="textSecondary">Acompanhe a rotina escolar da sua criança.</ThemedText>
          </SurfaceCard>
          <View style={styles.cards}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Acompanhamento</ThemedText>
            <Pressable onPress={() => router.push('/responsavel/agenda')} style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement }, pressed && styles.cardPressed]}>
              <View style={[styles.iconBox, { backgroundColor: theme.informationSoft }]}>
                <AppIcon name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} color={theme.information} size={23} />
              </View>
              <View style={styles.cardCopy}>
                <ThemedText type="smallBold">Agenda da criança</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Visualizar a rotina compartilhada</ThemedText>
                <ThemedText type="small" style={[styles.cardAction, { color: theme.information }]}>Ver agenda  ›</ThemedText>
              </View>
            </Pressable>
          </View>
          <PrimaryButton title="Sair" onPress={logout} variant="outline" />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start' },
  welcomeCard: { marginBottom: Spacing.one },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greetingCopy: { flex: 1 },
  title: { marginTop: Spacing.one, marginBottom: Spacing.one, fontSize: 28, lineHeight: 36 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: BrandColors.informationSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BrandColors.information, fontSize: 20, fontWeight: '800' },
  cards: { gap: Spacing.two, marginTop: Spacing.five, marginBottom: Spacing.five },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginBottom: Spacing.one },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.three, backgroundColor: BrandColors.backgroundElement, ...Shadows.card },
  cardPressed: { opacity: 0.88 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, gap: Spacing.one },
  cardAction: { color: BrandColors.information, fontWeight: '700', marginTop: Spacing.one },
});
