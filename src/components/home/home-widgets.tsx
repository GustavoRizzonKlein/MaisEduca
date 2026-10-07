import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, type IconKey } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Card, IconContainer } from '@/components/ui';
import { Palette, Radius, Shadows, Spacing, Tones, type Tone } from '@/constants/theme';

export type SummaryMetric = { label: string; value: number; icon: IconKey; tone: Tone };

/** Card "Resumo do dia" com métricas reais. */
export function DaySummaryCard({ title, metrics, loading }: { title: string; metrics: SummaryMetric[]; loading?: boolean }) {
  return (
    <Card style={styles.summary}>
      <View style={styles.summaryHeader}>
        <ThemedText type="heading">{title}</ThemedText>
        <AppIcon name="sparkles" color={Palette.yellowPrimary} size={18} />
      </View>
      <View style={styles.metrics}>
        {metrics.map((metric) => (
          <View
            key={metric.label}
            style={[styles.metric, { backgroundColor: Tones[metric.tone].light }]}
            accessibilityRole="text"
            accessibilityLabel={`${loading ? 'carregando' : metric.value} ${metric.label}`}>
            <AppIcon name={metric.icon} color={Tones[metric.tone].ink} size={18} />
            <ThemedText type="display" style={{ color: Tones[metric.tone].ink }}>
              {loading ? '–' : metric.value}
            </ThemedText>
            <ThemedText type="caption" style={{ color: Tones[metric.tone].ink }} numberOfLines={2}>{metric.label}</ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );
}

export type Shortcut = { label: string; description: string; icon: IconKey; tone: Tone; onPress: () => void };

/** Grade 2×N de atalhos (Agenda, Alunos, Turmas...). */
export function ShortcutGrid({ shortcuts }: { shortcuts: Shortcut[] }) {
  return (
    <View style={styles.grid}>
      {shortcuts.map((shortcut) => (
        <Pressable
          key={shortcut.label}
          accessibilityRole="button"
          accessibilityLabel={shortcut.label}
          accessibilityHint={shortcut.description}
          onPress={shortcut.onPress}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
          <IconContainer icon={shortcut.icon} tone={shortcut.tone} />
          <View style={styles.tileCopy}>
            <ThemedText type="subtitle" numberOfLines={1}>{shortcut.label}</ThemedText>
            <ThemedText type="caption" themeColor="textMuted" numberOfLines={2}>{shortcut.description}</ThemedText>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { gap: Spacing.three },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metrics: { flexDirection: 'row', gap: Spacing.two },
  metric: { flex: 1, borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.half, minWidth: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
    ...Shadows.card,
  },
  tileCopy: { gap: Spacing.half },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
