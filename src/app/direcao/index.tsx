import { Redirect, router, type Href } from 'expo-router';
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
import { mockStudents } from '@/mocks/teacher';
import {
  canApproveComunicados,
  canAssociateResponsaveis,
  canManageAlunos,
  canManageProfessorApoio,
  canManageProfessores,
  canManageResponsaveis,
  canManageTurmas,
  canManageUsers,
  canViewAcompanhamento,
  homeRouteForRole,
} from '@/types/auth';

export default function DirecaoHomeScreen() {
  const { user, isLoading, logout } = useAuth();
  const theme = useTheme();
  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'direcao') return <Redirect href={homeRouteForRole(user.role)} />;

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <SurfaceCard style={styles.welcomeCard}>
            <View style={styles.headerRow}>
              <View style={styles.greetingCopy}>
                <ThemedText type="small" themeColor="textSecondary">Área da direção</ThemedText>
                <ThemedText type="subtitle" style={styles.title}>Olá, {user.nome}!</ThemedText>
              </View>
              <View style={[styles.avatar, { backgroundColor: theme.attentionSoft }]}>
                <ThemedText style={[styles.avatarText, { color: theme.attention }]}>{user.nome.charAt(0)}</ThemedText>
              </View>
            </View>
            <ThemedText themeColor="textSecondary">Gestão da escola e acompanhamento pedagógico.</ThemedText>
          </SurfaceCard>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Gestão</ThemedText>
            {canManageUsers(user.role) && (
              <Pressable style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement }, pressed && styles.cardPressed]} onPress={() => router.push('/direcao/usuarios' as Href)}>
                <View style={[styles.featureIcon, { backgroundColor: theme.informationSoft }]}>
                  <AppIcon name={{ ios: 'person.2.fill', android: 'groups', web: 'groups' }} color={theme.information} size={22} />
                </View>
                <View style={styles.cardCopy}>
                  <ThemedText type="smallBold">Usuários</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Professores, Professores de Apoio e Responsáveis
                  </ThemedText>
                </View>
                <ThemedText type="small" style={[styles.cardAction, { color: theme.attention }]}>Abrir ›</ThemedText>
              </Pressable>
            )}
            {canManageTurmas(user.role) && (
              <Pressable style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement }, pressed && styles.cardPressed]} onPress={() => router.push('/direcao/turmas' as Href)}>
                <View style={[styles.featureIcon, { backgroundColor: theme.learningSoft }]}>
                  <AppIcon name={{ ios: 'person.3.fill', android: 'diversity_3', web: 'diversity_3' }} color={theme.learning} size={22} />
                </View>
                <View style={styles.cardCopy}>
                  <ThemedText type="smallBold">Turmas</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">Cadastrar e gerenciar turmas</ThemedText>
                </View>
                <ThemedText type="small" style={[styles.cardAction, { color: theme.attention }]}>Abrir ›</ThemedText>
              </Pressable>
            )}
            {canManageAlunos(user.role) && (
              <Pressable style={({ pressed }) => [styles.card, { backgroundColor: theme.backgroundElement }, pressed && styles.cardPressed]} onPress={() => router.push('/direcao/alunos' as Href)}>
                <View style={[styles.featureIcon, { backgroundColor: theme.successSoft }]}>
                  <AppIcon name={{ ios: 'book.closed.fill', android: 'auto_stories', web: 'auto_stories' }} color={theme.success} size={22} />
                </View>
                <View style={styles.cardCopy}>
                  <ThemedText type="smallBold">Alunos</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">Cadastrar e gerenciar alunos</ThemedText>
                </View>
                <ThemedText type="small" style={[styles.cardAction, { color: theme.attention }]}>Abrir ›</ThemedText>
              </Pressable>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Atribuições</ThemedText>
            {canManageProfessores(user.role) && (
              <CapabilityInfo title="Gestão de professores" description="Cadastro, edição, exclusão e turmas" />
            )}
            {canManageProfessorApoio(user.role) && (
              <CapabilityInfo title="Gestão de professores de apoio" description="Cadastro e alunos específicos" />
            )}
            {canManageResponsaveis(user.role) && canAssociateResponsaveis(user.role) && (
              <CapabilityInfo title="Gestão de responsáveis" description="Cadastro e vínculo com alunos" />
            )}
            {canApproveComunicados(user.role) && (
              <CapabilityInfo title="Comunicados" description="Inclui aprovação e rejeição de avisos" />
            )}
          </View>

          {canViewAcompanhamento(user.role) && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Acompanhamento</ThemedText>
              {mockStudents.map((student) => (
                <Pressable
                  key={student.id}
                  onPress={() => router.push(`/direcao/agenda/${student.id}` as Href)}
                  style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                  <View style={[styles.studentAvatar, { backgroundColor: theme.attentionSoft }]}>
                    <ThemedText style={[styles.studentAvatarText, { color: theme.attention }]}>{student.name.charAt(0)}</ThemedText>
                  </View>
                  <View style={styles.cardCopy}>
                    <ThemedText type="smallBold">{student.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{student.className}</ThemedText>
                    <ThemedText type="small" style={[styles.cardAction, { color: theme.attention }]}>Ver agenda  ›</ThemedText>
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

function CapabilityInfo({ title, description }: { title: string; description: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.capabilityInfo, { borderColor: theme.border }]} accessibilityRole="text">
      <ThemedText type="smallBold">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{description}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start' },
  welcomeCard: { marginBottom: Spacing.one },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  greetingCopy: { flex: 1 },
  title: { marginTop: Spacing.one, marginBottom: Spacing.one, fontSize: 28, lineHeight: 36 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: BrandColors.attentionSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BrandColors.attention, fontSize: 20, fontWeight: '800' },
  section: { gap: Spacing.two, marginTop: Spacing.five, marginBottom: Spacing.three },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginBottom: Spacing.one },
  capabilityInfo: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.three, backgroundColor: BrandColors.backgroundElement, ...Shadows.card },
  cardPressed: { opacity: 0.88 },
  cardCopy: { flex: 1, gap: Spacing.one },
  cardAction: { color: BrandColors.attention, fontWeight: '700', marginTop: Spacing.one },
  featureIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: BrandColors.attentionSoft, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: BrandColors.attention, fontSize: 18, fontWeight: '800' },
});
