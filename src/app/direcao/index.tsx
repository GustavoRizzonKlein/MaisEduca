import { Redirect, router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { BrandColors, Radius, Shadows, Spacing } from '@/constants/theme';
import { mockStudents } from '@/mocks/teacher';
import {
  canApproveComunicados,
  canAssociateResponsaveis,
  canManageProfessores,
  canManageResponsaveis,
  canViewAcompanhamento,
  homeRouteForRole,
} from '@/types/auth';

export default function DirecaoHomeScreen() {
  const { user, isLoading, logout } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'direcao') return <Redirect href={homeRouteForRole(user.role)} />;

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">Área da direção</ThemedText>
              <ThemedText type="subtitle" style={styles.title}>Olá, {user.nome}!</ThemedText>
            </View>
            <View style={styles.avatar}><ThemedText style={styles.avatarText}>{user.nome.charAt(0)}</ThemedText></View>
          </View>
          <ThemedText themeColor="textSecondary">Gestão da escola e acompanhamento pedagógico.</ThemedText>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Atribuições desta área</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionHint}>
              Resumo do que o perfil Direção pode fazer. Ainda não há ações disponíveis nesta tela.
            </ThemedText>
            {canManageProfessores(user.role) && (
              <CapabilityInfo title="Gestão de professores" description="Inclui cadastro e acompanhamento do corpo docente" />
            )}
            {canManageResponsaveis(user.role) && (
              <CapabilityInfo title="Gestão de responsáveis" description="Inclui cadastro e acompanhamento das famílias" />
            )}
            {canAssociateResponsaveis(user.role) && (
              <CapabilityInfo title="Vínculos com alunos" description="Inclui associação de responsáveis aos alunos" />
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
                  style={styles.card}>
                  <View style={styles.studentAvatar}>
                    <ThemedText style={styles.studentAvatarText}>{student.name.charAt(0)}</ThemedText>
                  </View>
                  <View style={styles.cardCopy}>
                    <ThemedText type="smallBold">{student.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{student.className}</ThemedText>
                    <ThemedText type="small" style={styles.cardAction}>Ver agenda  ›</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <PrimaryButton title="Sair" onPress={logout} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function CapabilityInfo({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.capabilityInfo} accessibilityRole="text">
      <ThemedText type="smallBold">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{description}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { ...authStyles.content, justifyContent: 'flex-start' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { marginTop: Spacing.one, marginBottom: Spacing.one },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: BrandColors.attentionSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BrandColors.attention, fontSize: 20, fontWeight: '800' },
  section: { gap: Spacing.two, marginTop: Spacing.five, marginBottom: Spacing.three },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginBottom: Spacing.one },
  sectionHint: { marginBottom: Spacing.one },
  capabilityInfo: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.three, backgroundColor: BrandColors.backgroundElement, ...Shadows.card },
  cardCopy: { flex: 1, gap: Spacing.one },
  cardAction: { color: BrandColors.attention, fontWeight: '700', marginTop: Spacing.one },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: BrandColors.attentionSoft, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: BrandColors.attention, fontSize: 18, fontWeight: '800' },
});
