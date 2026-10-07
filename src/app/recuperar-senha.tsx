import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField, authStyles, PrimaryButton } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/surface-card';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecuperarSenhaScreen() {
  const router = useRouter();
  const { requestPasswordReset, error, clearError } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit() {
    clearError();
    setInfo(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      setInfo('Informe um e-mail válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(normalizedEmail);
      setInfo('Se o e-mail estiver cadastrado, enviaremos as instruções para recuperar seu acesso.');
    } catch {
      // O contexto mantém a mensagem de erro exibida no formulário.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled">
          <ThemedText style={[authStyles.logo, { color: theme.brand }]}>Recuperar senha</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Informe o e-mail associado à sua conta.
            {'\n'}Enviaremos as instruções para recuperar seu acesso.
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

            {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
            {info && (
              <ThemedText style={[styles.info, { color: theme.brand, backgroundColor: theme.brandSoft }]}>
                {info}
              </ThemedText>
            )}

            <PrimaryButton title="Enviar instruções" onPress={handleSubmit} loading={isSubmitting} />
            <Pressable style={authStyles.linkButton} onPress={() => router.back()}>
              <ThemedText style={authStyles.linkText}>Voltar para o login</ThemedText>
            </Pressable>
          </SurfaceCard>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.four,
    lineHeight: 22,
  },
  info: {
    borderRadius: 12,
    padding: Spacing.three,
    lineHeight: 20,
  },
});
