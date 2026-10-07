import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField, authStyles, PrimaryButton } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/surface-card';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { getSupabase } from '@/lib/supabase';

function extractRecoveryCode(rawUrl: string | null): string | null {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);
    const searchCode = url.searchParams.get('code');
    if (searchCode) {
      return searchCode;
    }

    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    if (!hash) {
      return null;
    }

    const fragment = new URLSearchParams(hash);
    return fragment.get('code');
  } catch {
    return null;
  }
}

async function hydratePasswordRecoverySession(rawUrl: string | null): Promise<boolean> {
  if (!rawUrl) {
    return false;
  }

  try {
    const url = new URL(rawUrl);
    const code = url.searchParams.get('code') ?? extractRecoveryCode(rawUrl);
    if (code) {
      const { data, error } = await getSupabase().auth.exchangeCodeForSession(code);
      if (error || !data.session) {
        throw error ?? new Error('Sessão de recuperação inválida.');
      }
      return true;
    }

    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    if (hash) {
      const fragment = new URLSearchParams(hash);
      const accessToken = fragment.get('access_token');
      const refreshToken = fragment.get('refresh_token');
      if (accessToken && refreshToken) {
        const { data, error } = await getSupabase().auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error || !data.session) {
          throw error ?? new Error('Sessão de recuperação inválida.');
        }
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword, error, clearError } = useAuth();
  const theme = useTheme();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadRecoveryState(url: string | null) {
      const isValid = await hydratePasswordRecoverySession(url);
      if (!isActive) {
        return;
      }
      setIsRecoveryReady(isValid);
      setIsCheckingRecovery(false);
    }

    const subscription = Linking.addEventListener('url', (event) => {
      void loadRecoveryState(event.url);
    });

    void Linking.getInitialURL().then((initialUrl) => {
      void loadRecoveryState(initialUrl);
    });

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);

  async function handleSubmit() {
    clearError();
    setInfo(null);

    if (!isRecoveryReady) {
      setInfo('Link de recuperação inválido ou expirado.');
      return;
    }

    if (!novaSenha.trim()) {
      setInfo('A senha é obrigatória.');
      return;
    }

    if (!confirmarSenha.trim()) {
      setInfo('A senha é obrigatória.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setInfo('As senhas não coincidem.');
      return;
    }

    if (novaSenha.length < 6) {
      setInfo('A senha não atende aos requisitos mínimos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(novaSenha);
      setInfo('Senha redefinida com sucesso.');
      setNovaSenha('');
      setConfirmarSenha('');
      router.replace('/login');
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
          <ThemedText style={[authStyles.logo, { color: theme.brand }]}>Nova senha</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Digite sua nova senha.
          </ThemedText>

          <SurfaceCard style={authStyles.form}>
            {isCheckingRecovery ? (
              <ThemedText themeColor="textSecondary" style={styles.loadingText}>
                Validando o link de recuperação...
              </ThemedText>
            ) : null}

            <AuthField
              label="Nova senha"
              value={novaSenha}
              onChangeText={setNovaSenha}
              secureTextEntry
              placeholder="Digite sua nova senha"
              editable={isRecoveryReady}
            />
            <AuthField
              label="Confirmar nova senha"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
              placeholder="Confirme sua nova senha"
              editable={isRecoveryReady}
            />

            {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
            {info && (
              <ThemedText style={[styles.info, { color: theme.brand, backgroundColor: theme.brandSoft }]}>
                {info}
              </ThemedText>
            )}

            <PrimaryButton
              title="Redefinir senha"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isCheckingRecovery || !isRecoveryReady}
            />
            <Pressable style={authStyles.linkButton} onPress={() => router.replace('/login')}>
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
  },
  loadingText: {
    textAlign: 'center',
  },
  info: {
    borderRadius: 12,
    padding: Spacing.three,
    lineHeight: 20,
  },
});
