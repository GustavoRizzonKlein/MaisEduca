import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { BrandColors, Spacing } from '@/constants/theme';
import { homeRouteForRole } from '@/types/auth';

export default function IndexScreen() {
  const { user, isLoading, hasInvalidProfile } = useAuth();

  if (isLoading) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" color={BrandColors.brand} />
        <ThemedText type="small" themeColor="textSecondary">Carregando seu espaço...</ThemedText>
      </ThemedView>
    );
  }

  if (hasInvalidProfile) return <Redirect href={'/acesso-negado' as Href} />;
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={homeRouteForRole(user.role)} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
});
