import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Tones, toneFromString, type Tone } from '@/constants/theme';

type AvatarProps = {
  name: string;
  size?: 'small' | 'medium' | 'large';
  tone?: Tone;
};

const sizes = {
  small: { box: 40, font: 15 },
  medium: { box: 48, font: 18 },
  large: { box: 88, font: 32 },
} as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

/** Avatar com iniciais sobre tom pastel estável por nome. */
export function Avatar({ name, size = 'medium', tone }: AvatarProps) {
  const colors = Tones[tone ?? toneFromString(name)];
  const { box, font } = sizes[size];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.avatar,
        { width: box, height: box, backgroundColor: colors.light, borderColor: size === 'large' ? Palette.surface : colors.light },
        size === 'large' && styles.large,
      ]}>
      <ThemedText style={{ color: colors.ink, fontSize: font, lineHeight: font * 1.25, fontWeight: '700' }}>
        {initials(name)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  large: { borderWidth: 4 },
});
