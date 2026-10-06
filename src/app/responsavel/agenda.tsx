import { Redirect, Stack } from 'expo-router';

import { AgendaScreen } from '@/components/agenda-screen';
import { useAuth } from '@/contexts/auth-context';
import { homeRouteForRole } from '@/types/auth';

export default function ResponsavelAgendaRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'responsavel') return <Redirect href={homeRouteForRole(user.role)} />;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AgendaScreen
        studentId="student-joao"
        fallbackRoute="/responsavel"
      />
    </>
  );
}
