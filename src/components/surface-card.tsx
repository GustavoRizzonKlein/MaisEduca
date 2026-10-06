import { StyleSheet, type ViewProps } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Radius, Shadows, Spacing, type ThemeColor } from '@/constants/theme';

type SurfaceCardProps = ViewProps & {
  tone?: ThemeColor;
};

export function SurfaceCard({ children, style, tone, ...props }: SurfaceCardProps) {
  return (
    <ThemedView
      type={tone ?? 'backgroundElement'}
      style={[styles.card, style]}
      {...props}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Shadows.card,
  },
});
