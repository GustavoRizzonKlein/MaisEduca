import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

import { AgendaScreen } from '@/components/agenda-screen';
import { useAuth } from '@/contexts/auth-context';
import { canViewAcompanhamento, homeRouteForRole } from '@/types/auth';

export default function DirecaoAgendaRoute() {
  const { user, isLoading } = useAuth();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'direcao' || !canViewAcompanhamento(user.role)) {
    return <Redirect href={homeRouteForRole(user.role)} />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AgendaScreen
        studentId={studentId}
        fallbackRoute="/direcao"
      />
    </>
  );
}
