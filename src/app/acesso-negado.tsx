import { Redirect } from 'expo-router';

import { FullScreenLoading, UnauthorizedState } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';

/** Conta autenticada sem perfil válido: só é possível sair. */
export default function AccessDeniedScreen() {
  const { hasInvalidProfile, isLoading, logout } = useAuth();

  if (isLoading) return <FullScreenLoading />;
  if (!hasInvalidProfile) return <Redirect href="/login" />;

  return (
    <UnauthorizedState
      message={'Esta conta não possui um perfil válido.\nSolicite à Direção que revise seu cadastro.'}
      actionLabel="Voltar para o login"
      onAction={() => void logout()}
    />
  );
}
