import { Pressable, StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

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
    padding: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.five,
  },
  logo: {
    color: '#2563EB',
    fontSize: 38,
    lineHeight: 46,
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
    color: '#B91C1C',
    backgroundColor: '#FEF2F2',
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  linkButton: {
    alignSelf: 'center',
    padding: Spacing.two,
    marginTop: Spacing.two,
  },
  linkText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  helper: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});

const styles = StyleSheet.create({
  fieldGroup: {
    gap: Spacing.one,
  },
  input: {
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
