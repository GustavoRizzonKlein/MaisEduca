import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AuthLayout } from '@/components/auth-layout';
import { Button, Input, Notice } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecuperarSenhaScreen() {
  const router = useRouter();
  const { requestPasswordReset, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    clearError();
    setSent(false);

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      setFieldError('Informe um e-mail válido.');
      return;
    }
    setFieldError(null);

    setIsSubmitting(true);
    try {
      await requestPasswordReset(normalizedEmail);
      setSent(true);
    } catch {
      // O contexto mantém a mensagem de erro exibida no formulário.
    } finally {
      setIsSubmitting(false);
    }
  }

  function goToLogin() {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  }

  return (
    <AuthLayout
      icon="key"
      iconTone="yellow"
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta. Enviaremos as instruções para você criar uma nova senha.">
      <Input
        label="E-mail"
        icon="mail"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setFieldError(null);
        }}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="seu@email.com"
        error={fieldError}
        editable={!isSubmitting}
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
      />
      {error ? <Notice tone="error" message={error} /> : null}
      {sent ? (
        <Notice tone="success" message="Se o e-mail estiver cadastrado, enviaremos as instruções para recuperar seu acesso." />
      ) : null}
      <Button title={sent ? 'Reenviar instruções' : 'Enviar instruções'} icon="mail" onPress={handleSubmit} loading={isSubmitting} />
      <Button title="Voltar para o login" variant="ghost" icon="chevronLeft" onPress={goToLogin} disabled={isSubmitting} />
    </AuthLayout>
  );
}
