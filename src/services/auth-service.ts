import type { User as AuthUser } from '@supabase/supabase-js';

import { getSupabase } from '@/lib/supabase';
import { isUserRole, type PublicUser, type UserRole } from '@/types/auth';

function readRole(user: AuthUser): UserRole {
  // Autorização: somente app_metadata (não manipulável pelo cliente).
  const appRole = user.app_metadata?.role;
  if (isUserRole(appRole)) return appRole;

  throw new Error('A conta autenticada não possui um perfil válido.');
}

function toPublicUser(user: AuthUser): PublicUser {
  const email = user.email?.trim();
  if (!email) {
    throw new Error('A conta autenticada não possui e-mail.');
  }

  const nomeRaw = user.user_metadata?.nome;
  const nome = typeof nomeRaw === 'string' ? nomeRaw.trim() : '';
  if (!nome) {
    throw new Error('A conta autenticada não possui nome nos metadados.');
  }

  return {
    id: user.id,
    nome,
    email,
    role: readRole(user),
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
  const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) {
    throw new Error(authErrorMessage(error, 'Não foi possível enviar o e-mail de redefinição.'));
  }
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) {
    throw new Error(authErrorMessage(error, 'Não foi possível sair.'));
  }
}
