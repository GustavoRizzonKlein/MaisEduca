import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';

const professorRoute: Href = '/professor' as Href;
const responsavelRoute: Href = '/responsavel' as Href;

export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!user) return <Redirect href="/login" />;
  return <Redirect href={user.role === 'professor' ? professorRoute : responsavelRoute} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
