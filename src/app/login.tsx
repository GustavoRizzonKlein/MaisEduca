import { Redirect, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthLayout } from '@/components/auth-layout';
import { ThemedText } from '@/components/themed-text';
import { Button, Input, Notice } from '@/components/ui';
import { MinTouchSize, Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { homeRouteForRole } from '@/types/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const { user, login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; senha?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Redirect href={homeRouteForRole(user.role)} />;

  async function handleLogin() {
    clearError();
    const nextErrors: typeof fieldErrors = {};
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail.';
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Informe um e-mail válido.';
    if (!senha) nextErrors.senha = 'Informe sua senha.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
    <AuthLayout
      showLogo
      title="Bem-vindo!"
      subtitle="Faça login para continuar"
      footer={
        <>
          <View style={styles.divider}>
            <View style={styles.line} />
            <ThemedText type="caption" themeColor="textMuted">ou</ThemedText>
            <View style={styles.line} />
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Ainda não tem conta? As contas são criadas pela Direção da escola.
          </ThemedText>
        </>
      }>
      <Input
        label="E-mail"
        icon="mail"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setFieldErrors((current) => ({ ...current, email: undefined }));
        }}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="seu@email.com"
        error={fieldErrors.email}
        editable={!isSubmitting}
        returnKeyType="next"
      />
      <Input
        label="Senha"
        icon="lock"
        password
        value={senha}
        onChangeText={(value) => {
          setSenha(value);
          setFieldErrors((current) => ({ ...current, senha: undefined }));
        }}
        autoComplete="password"
        textContentType="password"
        placeholder="Digite sua senha"
        error={fieldErrors.senha}
        editable={!isSubmitting}
        returnKeyType="go"
        onSubmitEditing={handleLogin}
      />
      {error ? <Notice tone="error" message={error} /> : null}
      <Button title="Entrar" onPress={handleLogin} loading={isSubmitting} style={styles.submit} />
      <Pressable
        accessibilityRole="link"
        style={styles.link}
        onPress={() => router.push('/recuperar-senha' as Href)}
        disabled={isSubmitting}>
        <ThemedText type="link">Esqueceu sua senha?</ThemedText>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  submit: { marginTop: Spacing.two },
  link: { alignSelf: 'center', minHeight: MinTouchSize, justifyContent: 'center', paddingHorizontal: Spacing.three },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, alignSelf: 'stretch' },
  line: { flex: 1, height: 1, backgroundColor: Palette.border },
  center: { textAlign: 'center' },
});
