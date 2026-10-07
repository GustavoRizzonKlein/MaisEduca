import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthLayout } from '@/components/auth-layout';
import { Button, Input, Notice } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import { getSupabase } from '@/lib/supabase';

const SUCCESS_MESSAGE = 'Senha redefinida com sucesso.';

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
      setInfo(SUCCESS_MESSAGE);
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
    <AuthLayout
      icon="shield"
      iconTone="green"
      title="Nova senha"
      subtitle="Crie uma nova senha para acessar o MaisEduca.">
      {isCheckingRecovery ? <Notice tone="info" message="Validando o link de recuperação..." /> : null}
      {!isCheckingRecovery && !isRecoveryReady ? (
        <Notice tone="error" message="Link de recuperação inválido ou expirado. Solicite um novo e-mail de recuperação." />
      ) : null}
      <Input
        label="Nova senha"
        icon="lock"
        password
        value={novaSenha}
        onChangeText={setNovaSenha}
        placeholder="Digite sua nova senha"
        helperText="Mínimo de 6 caracteres."
        textContentType="newPassword"
        editable={isRecoveryReady && !isSubmitting}
      />
      <Input
        label="Confirmar nova senha"
        icon="lock"
        password
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        placeholder="Confirme sua nova senha"
        textContentType="newPassword"
        editable={isRecoveryReady && !isSubmitting}
      />
      {error ? <Notice tone="error" message={error} /> : null}
      {info ? <Notice tone={info === SUCCESS_MESSAGE ? 'success' : 'error'} message={info} /> : null}
      <Button
        title="Redefinir senha"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isCheckingRecovery || !isRecoveryReady}
      />
      <Button title="Voltar para o login" variant="ghost" icon="chevronLeft" onPress={() => router.replace('/login')} />
    </AuthLayout>
  );
}
