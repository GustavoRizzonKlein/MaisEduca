import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Palette, Radius, Shadows, Spacing } from '@/constants/theme';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Fundo pastel opcional para cards de destaque. */
  background?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Card branco, borda discreta e sombra muito suave. */
export function Card({ children, onPress, accessibilityLabel, accessibilityHint, background, padded = true, style }: CardProps) {
  const baseStyle = [styles.card, padded && styles.padded, background ? { backgroundColor: background } : null];

  if (!onPress) {
    return <View style={[baseStyle, style]}>{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [baseStyle, pressed && styles.pressed, style]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
    ...Shadows.card,
  },
  padded: { padding: Spacing.three },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
