import { Redirect, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { AgendaScreen } from '@/components/agenda-screen';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';

const loginRoute: Href = '/login' as Href;

export default function ProfessorAgendaRoute() {
  const { user, isLoading } = useAuth();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  if (isLoading) return null;
  if (!user) return <Redirect href={loginRoute} />;
  if (user.role !== 'professor') return <Redirect href="/responsavel" />;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AgendaScreen studentId={studentId} canEdit />
    </>
  );
}
