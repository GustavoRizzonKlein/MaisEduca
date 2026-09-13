import { Link, Redirect, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthField, authStyles, PrimaryButton } from '@/components/auth-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { BrandColors, Radius } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/types/auth';

const professorRoute: Href = '/professor' as Href;
const responsavelRoute: Href = '/responsavel' as Href;

export default function CadastroScreen() {
  const router = useRouter();
  const { user, register, error, clearError } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) return <Redirect href={user.role === 'professor' ? professorRoute : responsavelRoute} />;

  async function handleRegister() {
    setValidationError(null);
    clearError();
    if (!nome.trim() || !email.trim() || !senha || !confirmacao || !role) {
      setValidationError('Preencha todos os campos e selecione o tipo de usuário.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Informe um e-mail válido.');
      return;
    }
    if (senha !== confirmacao) {
      setValidationError('A confirmação de senha deve ser igual à senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const registeredUser = await register(nome, email, senha, role);
      router.replace(registeredUser.role === 'professor' ? professorRoute : responsavelRoute);
    } catch {
      // O contexto mantém a mensagem exibida no formulário.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemedView style={authStyles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.title}>Criar conta</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.description}>
            Escolha o perfil que será usado no MaisEduca.
          </ThemedText>
          <View style={authStyles.form}>
            <AuthField label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome" />
            <AuthField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="seu@email.com"
            />
            <AuthField label="Senha" value={senha} onChangeText={setSenha} secureTextEntry placeholder="Mínimo de 6 caracteres" />
            <AuthField
              label="Confirmar senha"
              value={confirmacao}
              onChangeText={setConfirmacao}
              secureTextEntry
              placeholder="Repita sua senha"
            />
            <ThemedText type="smallBold">Como você usa o MaisEduca?</ThemedText>
            <View style={styles.roleRow}>
              <RoleOption label="Professor" selected={role === 'professor'} onPress={() => setRole('professor')} />
              <RoleOption label="Responsável" selected={role === 'responsavel'} onPress={() => setRole('responsavel')} />
            </View>
            {(validationError || error) && (
              <ThemedText style={authStyles.error}>{validationError ?? error}</ThemedText>
            )}
            <PrimaryButton title="Criar conta" onPress={handleRegister} disabled={isSubmitting} />
          </View>
          <Link href="/login" asChild>
            <Pressable style={authStyles.linkButton}>
              <ThemedText style={authStyles.linkText}>Já tenho uma conta</ThemedText>
            </Pressable>
          </Link>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function RoleOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.roleOption, selected && styles.roleOptionSelected]}>
      <View style={[styles.radio, selected && styles.radioSelected]} />
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    ...authStyles.content,
    justifyContent: 'flex-start',
  },
  title: {
    marginBottom: Spacing.one,
  },
  description: {
    marginBottom: Spacing.five,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  roleOptionSelected: {
    borderColor: BrandColors.brand,
    backgroundColor: BrandColors.brandSoft,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: BrandColors.textSecondary,
  },
  radioSelected: {
    borderColor: BrandColors.brand,
    backgroundColor: BrandColors.brand,
  },
});
