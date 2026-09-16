import { Redirect, Stack, type Href } from 'expo-router';

import { AgendaScreen } from '@/components/agenda-screen';
import { useAuth } from '@/contexts/auth-context';

const loginRoute: Href = '/login' as Href;

export default function ResponsavelAgendaRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect href={loginRoute} />;
  if (user.role !== 'responsavel') return <Redirect href="/professor" />;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AgendaScreen studentId="student-joao" canEdit={false} />
    </>
  );
}
