import { getSupabase } from '@/lib/supabase';
import type { ManagedProfile, ManagedUserRole } from '@/types/auth';

type ManageUsersResponse = {
  users?: ManagedProfile[];
  user?: ManagedProfile;
  ok?: boolean;
  error?: string;
  passwordResetEmailSent?: boolean;
  passwordResetWarning?: string;
};

async function invokeManageUsers(body: Record<string, unknown>): Promise<ManageUsersResponse> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke<ManageUsersResponse>('manage-users', {
    body,
  });

  if (data?.error) {
    throw new Error(data.error);
  }
  if (error) {
    // Tenta extrair mensagem do body quando a function retorna 4xx.
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const payload = (await context.json()) as ManageUsersResponse;
        if (payload?.error) throw new Error(payload.error);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== error.message) throw parseError;
      }
    }
    throw new Error(error.message || 'Falha ao chamar o serviço de usuários.');
  }
  return data ?? {};
}

export async function listManagedUsers(): Promise<ManagedProfile[]> {
  const data = await invokeManageUsers({ action: 'list' });
  return (data.users ?? []).filter((user) => user.role !== ('direcao' as ManagedUserRole)) as ManagedProfile[];
}

export async function createManagedUser(input: {
  nome: string;
  email: string;
  senha: string;
  role: ManagedUserRole;
}): Promise<{ user: ManagedProfile; passwordResetEmailSent: boolean; passwordResetWarning?: string }> {
  const data = await invokeManageUsers({ action: 'create', ...input });
  if (!data.user) throw new Error('Não foi possível criar o usuário.');
  return {
    user: data.user as ManagedProfile,
    passwordResetEmailSent: Boolean(data.passwordResetEmailSent),
    passwordResetWarning: data.passwordResetWarning,
  };
}

export async function updateManagedUser(input: {
  id: string;
  nome?: string;
  email?: string;
  role?: ManagedUserRole;
  senha?: string;
}): Promise<ManagedProfile> {
  const data = await invokeManageUsers({ action: 'update', ...input });
  if (!data.user) throw new Error('Não foi possível atualizar o usuário.');
  return data.user as ManagedProfile;
}

export async function deleteManagedUser(id: string): Promise<void> {
  await invokeManageUsers({ action: 'delete', id });
}

export async function sendManagedUserPasswordReset(email: string): Promise<void> {
  await invokeManageUsers({ action: 'send_password_reset', email });
}
