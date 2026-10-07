import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField, authStyles, PrimaryButton } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/surface-card';
import { BrandColors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { homeRouteForRole } from '@/types/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { user, login, error, clearError } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Redirect href={homeRouteForRole(user.role)} />;

  async function handleLogin() {
    clearError();
    if (!email.trim() || !senha) {
      return;
    }

    setIsSubmitting(true);
    try {
      const authenticatedUser = await login(email, senha);
      router.replace(homeRouteForRole(authenticatedUser.role));
    } catch {
      // O contexto mantém a mensagem exibida no formulário.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled">
          <ThemedView type="backgroundElement" style={[styles.brandMark, { backgroundColor: theme.brandSoft }]}>
            <ThemedText style={[styles.brandMarkText, { color: theme.brand }]}>M</ThemedText>
          </ThemedView>
          <ThemedText style={[authStyles.logo, { color: theme.brand }]}>MaisEduca</ThemedText>
          <ThemedText themeColor="textSecondary" style={authStyles.subtitle}>
            Conectando escola, professores e famílias.
          </ThemedText>

          <SurfaceCard style={authStyles.form}>
            <AuthField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="seu@email.com"
            />
            <AuthField
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              placeholder="Digite sua senha"
            />
            {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
            <PrimaryButton title="Entrar" onPress={handleLogin} loading={isSubmitting} />
            <Pressable style={authStyles.linkButton} onPress={() => router.push('/recuperar-senha' as any)} disabled={isSubmitting}>
              <ThemedText style={authStyles.linkText}>Esqueci minha senha</ThemedText>
            </Pressable>
          </SurfaceCard>

          <ThemedText themeColor="textSecondary" style={authStyles.helper}>
            Contas são criadas pela Direção da escola.
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  brandMark: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.brandSoft,
    marginBottom: Spacing.two,
  },
  brandMarkText: {
    color: BrandColors.brand,
    fontSize: 30,
    fontWeight: '800',
  },
  info: {
    color: BrandColors.brand,
    backgroundColor: BrandColors.brandSoft,
    borderRadius: Radius.small,
    padding: Spacing.three,
  },
});
