import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

/**
 * Marca MaisEduca (símbolo "M" + wordmark). Usada só em splash, login e telas
 * institucionais — não repetir em todas as telas.
 */
export function BrandLogo({ size = 'large' }: { size?: 'medium' | 'large' }) {
  const mark = size === 'large' ? 76 : 56;

  return (
    <View style={styles.lockup} accessibilityRole="image" accessibilityLabel="MaisEduca">
      <View style={[styles.mark, { width: mark, height: mark, borderRadius: mark * 0.34 }]}>
        <View style={styles.markAccent} />
        <ThemedText style={[styles.markText, { fontSize: mark * 0.46, lineHeight: mark * 0.58 }]}>M</ThemedText>
      </View>
      <ThemedText style={[styles.wordmark, size === 'medium' && styles.wordmarkMedium]}>
        <ThemedText style={[styles.wordmark, size === 'medium' && styles.wordmarkMedium, { color: Palette.blueInk }]}>Mais</ThemedText>
        <ThemedText style={[styles.wordmark, size === 'medium' && styles.wordmarkMedium, { color: Palette.textPrimary }]}>Educa</ThemedText>
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { alignItems: 'center', gap: Spacing.three },
  mark: {
    backgroundColor: Palette.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  markAccent: {
    position: 'absolute',
    right: -10,
    top: -10,
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: Palette.yellowSoft,
    opacity: 0.8,
  },
  markText: { color: Palette.blueInk, fontWeight: '800' },
  wordmark: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.4 },
  wordmarkMedium: { fontSize: 22, lineHeight: 28 },
});
