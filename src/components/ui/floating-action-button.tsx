import { Pressable, StyleSheet } from 'react-native';

import { AppIcon, type IconKey } from '@/components/app-icon';
import { Palette, Radius, Shadows, Spacing } from '@/constants/theme';

type FloatingActionButtonProps = {
  icon?: IconKey;
  accessibilityLabel: string;
  onPress: () => void;
};

/** Ação principal flutuante da tela (ex.: nova atividade). */
export function FloatingActionButton({ icon = 'plus', accessibilityLabel, onPress }: FloatingActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
      <AppIcon name={icon} color={Palette.white} size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Palette.bluePrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.95 }] },
});
