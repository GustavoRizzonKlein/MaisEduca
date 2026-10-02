import type { User as AuthUser } from '@supabase/supabase-js';

import { getSupabase } from '@/lib/supabase';
import type { PublicUser, UserRole } from '@/types/auth';

function isUserRole(value: unknown): value is UserRole {
  return value === 'professor' || value === 'responsavel';
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

  // RISCO (HIGH, pendente de requisito externo): `role` está em user_metadata,
  // que o próprio usuário pode alterar via Auth API. Isso basta para roteamento
  // da UI hoje, mas NÃO é autorização segura (RLS / privileging).
  // Não migrar para app_metadata ou tabela profiles sem schema/estratégia definidos.
  const role = user.user_metadata?.role;
  if (!isUserRole(role)) {
    throw new Error('A conta autenticada não possui um perfil válido (professor ou responsável).');
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
  return error.message;
}

export async function getSession(): Promise<PublicUser | null> {
  const supabase = getSupabase();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(authErrorMessage(sessionError, 'Não foi possível carregar a sessão.'));
  }
  if (!sessionData.session) return null;

  // Valida o JWT local com a API Auth; sessão revogada/inválida não é aceita.
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

  return toPublicUser(data.user);
}

export async function signUp(
  nome: string,
  email: string,
  senha: string,
  role: UserRole,
): Promise<PublicUser> {
  const { data, error } = await getSupabase().auth.signUp({
    email: email.trim().toLowerCase(),
    password: senha,
    options: {
      data: {
        nome: nome.trim(),
        role,
      },
    },
  });

  if (error) {
    throw new Error(authErrorMessage(error, 'Não foi possível criar a conta.'));
  }
  if (!data.user) {
    throw new Error('Não foi possível criar a conta.');
  }
  // Sem sessão: projeto provavelmente exige confirmação de e-mail.
  if (!data.session) {
    throw new Error('Conta criada. Confirme o e-mail antes de entrar.');
  }

  return toPublicUser(data.user);
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) {
    throw new Error(authErrorMessage(error, 'Não foi possível sair.'));
  }
}
