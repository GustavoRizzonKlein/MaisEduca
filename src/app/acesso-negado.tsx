import { Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/surface-card';
import { useAuth } from '@/contexts/auth-context';
import { Spacing } from '@/constants/theme';

export default function AccessDeniedScreen() {
  const { hasInvalidProfile, isLoading, logout } = useAuth();

  if (isLoading) return null;
  if (!hasInvalidProfile) return <Redirect href="/login" />;

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.content}>
        <SurfaceCard>
          <ThemedText type="subtitle">Acesso não autorizado</ThemedText>
          <ThemedText themeColor="textSecondary">
            Esta conta não possui um perfil válido. Solicite à Direção que revise seu cadastro.
          </ThemedText>
          <PrimaryButton title="Sair" onPress={logout} variant="secondary" />
        </SurfaceCard>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    ...authStyles.content,
    justifyContent: 'center',
    gap: Spacing.three,
  },
});
