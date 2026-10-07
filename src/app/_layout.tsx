import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { AgendaProvider } from '@/contexts/agenda-context';
import { hasAnyRole } from '@/types/auth';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <AgendaProvider>
          <AnimatedSplashOverlay />
          <AuthorizedStack />
        </AgendaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AuthorizedStack() {
  const { user, isLoading, hasInvalidProfile } = useAuth();
  const isDirecao = !isLoading && hasAnyRole(user?.role, ['direcao']);
  const isProfessor = !isLoading && hasAnyRole(user?.role, ['professor', 'apoio']);
  const isResponsavel = !isLoading && hasAnyRole(user?.role, ['responsavel']);
  const isSignedOut = !isLoading && !user && !hasInvalidProfile;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Protected guard={isSignedOut}>
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="recuperar-senha" />
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
      <Stack.Protected guard={hasInvalidProfile}>
        <Stack.Screen name="acesso-negado" />
      </Stack.Protected>
      <Stack.Protected guard={isDirecao}>
        <Stack.Screen name="direcao/index" />
        <Stack.Screen name="direcao/usuarios" />
        <Stack.Screen name="direcao/turmas" />
        <Stack.Screen name="direcao/turmas/[turmaId]" />
        <Stack.Screen name="direcao/alunos" />
        <Stack.Screen name="direcao/agenda/[studentId]" />
      </Stack.Protected>
      <Stack.Protected guard={isProfessor}>
        <Stack.Screen name="professor/index" />
        <Stack.Screen name="professor/turmas" />
        <Stack.Screen name="professor/turmas/[turmaId]" />
        <Stack.Screen name="professor/agenda/[studentId]" />
      </Stack.Protected>
      <Stack.Protected guard={isResponsavel}>
        <Stack.Screen name="responsavel/index" />
        <Stack.Screen name="responsavel/agenda" />
      </Stack.Protected>
    </Stack>
  );
}
