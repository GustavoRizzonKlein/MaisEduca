import * as Linking from 'expo-linking';
import type { User as AuthUser } from '@supabase/supabase-js';

import { getSupabase } from '@/lib/supabase';
import { normalizeUserRole, type PublicUser } from '@/types/auth';

export class InvalidUserProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserProfileError';
  }
}

async function toPublicUser(user: AuthUser): Promise<PublicUser> {
  const { data: profile, error } = await getSupabase()
    .from('profiles')
    .select('id, nome, email, role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Não foi possível carregar o perfil: ${error.message}`);
  }
  if (!profile || profile.id !== user.id) {
    throw new InvalidUserProfileError('A conta autenticada não possui um perfil cadastrado.');
  }

  const role = normalizeUserRole(profile.role);
  const authRole = normalizeUserRole(user.app_metadata?.role);
  if (!role || !authRole || role !== authRole) {
    throw new InvalidUserProfileError('O perfil cadastrado não é válido ou está desatualizado.');
  }

  const email = typeof profile.email === 'string' ? profile.email.trim() : '';
  if (!email) {
    throw new InvalidUserProfileError('A conta autenticada não possui e-mail.');
  }

  const nomeRaw = profile.nome;
  const nome = typeof nomeRaw === 'string' ? nomeRaw.trim() : '';
  if (!nome) {
    throw new InvalidUserProfileError('A conta autenticada não possui nome nos metadados.');
  }

  return {
    id: user.id,
    nome,
    email,
    role,
  };
}

function authErrorMessage(error: { message: string; status?: number } | null, fallback: string): string {
  if (!error?.message) return fallback;
  const message = error.message.toLowerCase();
  if (message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (message.includes('user already registered')) {
    return 'Já existe uma conta cadastrada com este e-mail.';
  }
  if (message.includes('email not confirmed')) {
    return 'Confirme o e-mail da conta antes de entrar.';
  }
  if (message.includes('password should be at least') || message.includes('password too short') || message.includes('should be at least 6')) {
    return 'A senha não atende aos requisitos mínimos.';
  }
  if (message.includes('cadastro público desabilitado') || message.includes('signups not allowed')) {
    return 'Cadastro público desabilitado. Contas são criadas apenas pela Direção.';
  }
  return error.message;
}

export async function getSession(): Promise<PublicUser | null> {
  const supabase = getSupabase();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(authErrorMessage(sessionError, 'Não foi possível carregar a sessão.'));
  }
  if (!sessionData.session) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    return null;
  }

  return toPublicUser(data.user);
}

export async function signIn(email: string, senha: string): Promise<PublicUser> {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });

  if (error) {
    throw new Error(authErrorMessage(error, 'Não foi possível entrar.'));
  }
  if (!data.user) {
    throw new Error('Não foi possível entrar.');
  }

  // Garante JWT atualizado com app_metadata.role após migração.
  await getSupabase().auth.refreshSession().catch(() => undefined);
  const { data: fresh, error: freshError } = await getSupabase().auth.getUser();
  if (freshError || !fresh.user) {
    return toPublicUser(data.user);
  }
  return toPublicUser(fresh.user);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const redirectTo = Linking.createURL('/reset-password');
  const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });
  if (error) {
    throw new Error(authErrorMessage(error, 'Não foi possível enviar o e-mail de redefinição.'));
  }
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await getSupabase().auth.updateUser({ password });
  if (error) {
    throw new Error(authErrorMessage(error, 'Não foi possível redefinir a senha.'));
  }
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) {
    throw new Error(authErrorMessage(error, 'Não foi possível sair.'));
  }
}
