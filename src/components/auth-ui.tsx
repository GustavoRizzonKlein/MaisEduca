import { ActivityIndicator, Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AuthField({ label, ...props }: TextInputProps & { label: string }) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.fieldGroup}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        {...props}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, backgroundColor: theme.inputBackground, borderColor: theme.border }]}
        accessibilityLabel={label}
      />
    </ThemedView>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
}) {
  const isDisabled = disabled || loading;
  const theme = useTheme();
  const variantBackground: Record<typeof variant, string> = {
    primary: theme.brandAction,
    secondary: theme.brandSoft,
    outline: 'transparent',
    danger: theme.dangerSoft,
    success: theme.successSoft,
  };
  const variantForeground: Record<typeof variant, string> = {
    primary: theme.brand,
    secondary: theme.text,
    outline: theme.text,
    danger: theme.danger,
    success: theme.success,
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        styles[variant],
        { backgroundColor: variantBackground[variant], borderColor: theme.border },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}>
      <View style={styles.buttonContent}>
        {loading && (
          <ActivityIndicator size="small" color={variantForeground[variant]} />
        )}
        <ThemedText style={[styles.primaryButtonText, { color: variantForeground[variant] }]}>
          {title}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.five,
  },
  logo: {
    color: BrandColors.brand,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: Spacing.one,
    marginBottom: Spacing.five,
  },
  form: {
    gap: Spacing.three,
  },
  error: {
    color: BrandColors.danger,
    backgroundColor: BrandColors.dangerSoft,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  linkButton: {
    alignSelf: 'center',
    padding: Spacing.two,
    marginTop: Spacing.two,
  },
  linkText: {
    color: BrandColors.brand,
    fontWeight: '700',
  },
  helper: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});

const styles = StyleSheet.create({
  fieldGroup: {
    gap: Spacing.two,
  },
  input: {
    color: Colors.light.text,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    minHeight: 54,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.brandAction,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    minHeight: 52,
    justifyContent: 'center',
    ...Shadows.card,
  },
  primary: {},
  secondary: {
    boxShadow: 'none',
    elevation: 0,
  },
  outline: {
    borderWidth: 1,
    boxShadow: 'none',
    elevation: 0,
  },
  danger: {
    boxShadow: 'none',
    elevation: 0,
  },
  success: {},
  primaryButtonText: { fontWeight: '700' },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
