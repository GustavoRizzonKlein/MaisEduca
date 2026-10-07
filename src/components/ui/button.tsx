import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon, type IconKey } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { MinTouchSize, Palette, Radius, Spacing } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';

const variants: Record<ButtonVariant, { background: string; border: string; foreground: string }> = {
  primary: { background: Palette.bluePrimary, border: Palette.bluePrimary, foreground: Palette.white },
  secondary: { background: Palette.surface, border: Palette.blueSoft, foreground: Palette.blueInk },
  outline: { background: Palette.surface, border: Palette.border, foreground: Palette.textPrimary },
  danger: { background: Palette.pinkLight, border: Palette.pinkLight, foreground: Palette.errorInk },
  success: { background: Palette.greenPrimary, border: Palette.greenPrimary, foreground: Palette.white },
  ghost: { background: 'transparent', border: 'transparent', foreground: Palette.blueInk },
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'regular' | 'small';
  icon?: IconKey;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Botão único do design system. As variações visuais (primário, secundário,
 * outline, perigo, sucesso, ghost) são escolhidas por `variant`.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'regular',
  icon,
  disabled = false,
  loading = false,
  fullWidth = true,
  accessibilityHint,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const colors = variants[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'small' ? styles.small : styles.regular,
        fullWidth ? styles.fullWidth : styles.inline,
        { backgroundColor: colors.background, borderColor: colors.border },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.foreground} />
        ) : icon ? (
          <AppIcon name={icon} color={colors.foreground} size={size === 'small' ? 16 : 18} />
        ) : null}
        <ThemedText
          type={size === 'small' ? 'smallBold' : 'subtitle'}
          style={{ color: colors.foreground }}
          numberOfLines={1}>
          {title}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regular: { minHeight: 52, paddingHorizontal: Spacing.four },
  small: { minHeight: MinTouchSize - 4, paddingHorizontal: Spacing.three, borderRadius: Radius.small },
  fullWidth: { alignSelf: 'stretch' },
  inline: {},
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.5 },
});
