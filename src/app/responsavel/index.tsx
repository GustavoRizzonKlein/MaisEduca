import { Redirect, router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';

const professorRoute: Href = '/professor' as Href;

export default function ResponsavelHomeScreen() {
  const { user, isLoading, logout } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'responsavel') return <Redirect href={professorRoute} />;

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">Área da família</ThemedText>
              <ThemedText type="subtitle" style={styles.title}>Olá, {user.nome}!</ThemedText>
            </View>
            <View style={styles.avatar}><ThemedText style={styles.avatarText}>{user.nome.charAt(0)}</ThemedText></View>
          </View>
          <ThemedText themeColor="textSecondary">Acompanhe a rotina escolar da sua criança.</ThemedText>
          <View style={styles.cards}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Acompanhamento</ThemedText>
            <Pressable onPress={() => router.push('/responsavel/agenda')} style={styles.card}>
              <View style={styles.iconBox}><ThemedText style={styles.icon}>◷</ThemedText></View>
              <View style={styles.cardCopy}>
                <ThemedText type="smallBold">Agenda da criança</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Visualizar a rotina compartilhada</ThemedText>
                <ThemedText type="small" style={styles.cardAction}>Ver agenda  ›</ThemedText>
              </View>
            </Pressable>
          </View>
          <PrimaryButton title="Sair" onPress={logout} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { marginTop: Spacing.one, marginBottom: Spacing.one },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: BrandColors.informationSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BrandColors.information, fontSize: 20, fontWeight: '800' },
  cards: { gap: Spacing.two, marginTop: Spacing.five, marginBottom: Spacing.five },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginBottom: Spacing.one },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.three, backgroundColor: BrandColors.backgroundElement, ...Shadows.card },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: BrandColors.informationSoft, alignItems: 'center', justifyContent: 'center' },
  icon: { color: BrandColors.information, fontSize: 25, fontWeight: '700' },
  cardCopy: { flex: 1, gap: Spacing.one },
  cardAction: { color: BrandColors.information, fontWeight: '700', marginTop: Spacing.one },
});
