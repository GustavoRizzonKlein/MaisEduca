import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Palette } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { can, hasAnyRole } from '@/types/auth';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Palette.background, card: Palette.surface, border: Palette.border, primary: Palette.bluePrimary, text: Palette.textPrimary },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <StatusBar style="dark" />
        <AnimatedSplashOverlay />
        <AuthorizedStack />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AuthorizedStack() {
  const { user, isLoading, hasInvalidProfile } = useAuth();
  const isSignedIn = !isLoading && Boolean(user);
  const isDirecao = !isLoading && hasAnyRole(user?.role, ['direcao']);
  const isProfessor = !isLoading && hasAnyRole(user?.role, ['professor', 'apoio']);
  const canTakeAttendance = !isLoading && can(user?.role, 'frequencia:edit');
  // Liberado também durante o carregamento da sessão: sem isso, deep links como
  // /reset-password?code=... (e-mail de recuperação) eram redirecionados antes de abrir.
  const isSignedOut = !user && !hasInvalidProfile;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Palette.background } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={isSignedOut}>
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
        <Stack.Screen name="recuperar-senha" />
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
      <Stack.Protected guard={hasInvalidProfile}>
        <Stack.Screen name="acesso-negado" />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="alunos/[alunoId]" />
        <Stack.Screen name="desempenho/turma/[turmaId]" />
        <Stack.Screen name="desempenho/aluno/[alunoId]" />
        <Stack.Screen name="relatorios/index" />
        <Stack.Screen name="relatorios/turma/[turmaId]" />
        <Stack.Screen name="relatorios/aluno/[alunoId]" />
      </Stack.Protected>
      <Stack.Protected guard={canTakeAttendance}>
        <Stack.Screen name="chamada/[turmaId]" />
      </Stack.Protected>
      <Stack.Protected guard={isDirecao}>
        <Stack.Screen name="direcao/usuarios" />
        <Stack.Screen name="direcao/turmas" />
        <Stack.Screen name="direcao/turmas/[turmaId]" />
      </Stack.Protected>
      <Stack.Protected guard={isProfessor}>
        <Stack.Screen name="professor/turmas" />
        <Stack.Screen name="professor/turmas/[turmaId]" />
      </Stack.Protected>
    </Stack>
  );
}
