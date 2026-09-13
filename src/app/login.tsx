import { Link, Redirect, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField, authStyles, PrimaryButton } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';

const professorRoute: Href = '/professor' as Href;
const responsavelRoute: Href = '/responsavel' as Href;

export default function LoginScreen() {
  const router = useRouter();
  const { user, login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Redirect href={user.role === 'professor' ? professorRoute : responsavelRoute} />;

  async function handleLogin() {
    clearError();
    if (!email.trim() || !senha) {
      return;
    }

    setIsSubmitting(true);
    try {
      const authenticatedUser = await login(email, senha);
      router.replace(authenticatedUser.role === 'professor' ? professorRoute : responsavelRoute);
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
          <ThemedText style={authStyles.logo}>MaisEduca</ThemedText>
          <ThemedText themeColor="textSecondary" style={authStyles.subtitle}>
            Acompanhamento escolar mais próximo
          </ThemedText>

          <ThemedView style={authStyles.form}>
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
            <PrimaryButton title="Entrar" onPress={handleLogin} disabled={isSubmitting} />
          </ThemedView>

          <Link href="/cadastro" asChild>
            <Pressable style={authStyles.linkButton}>
              <ThemedText style={authStyles.linkText}>Criar uma conta</ThemedText>
            </Pressable>
          </Link>
          <ThemedText type="small" themeColor="textSecondary" style={authStyles.helper}>
            Teste: professor@maiseduca.com ou responsavel@maiseduca.com
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
});
