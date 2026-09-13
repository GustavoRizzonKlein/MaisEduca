import { Pressable, StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Colors, Radius, Shadows, Spacing } from '@/constants/theme';

export function AuthField({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <ThemedView style={styles.fieldGroup}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        {...props}
        placeholderTextColor={Colors.light.textSecondary}
        style={styles.input}
        accessibilityLabel={label}
      />
    </ThemedView>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, disabled && styles.disabled]}>
      <ThemedText style={styles.primaryButtonText}>{title}</ThemedText>
    </Pressable>
  );
}

export const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  logo: {
    color: BrandColors.brand,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: Spacing.one,
    marginBottom: Spacing.four,
  },
  form: {
    gap: Spacing.three,
  },
  error: {
    color: BrandColors.danger,
    backgroundColor: BrandColors.dangerSoft,
    borderRadius: Radius.small,
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
    borderRadius: Radius.small,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.brand,
    borderRadius: Radius.small,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    minHeight: 52,
    justifyContent: 'center',
    ...Shadows.card,
  },
  primaryButtonText: {
    color: Colors.light.onBrand,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
