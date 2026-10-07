import { StyleSheet, View } from 'react-native';

import type { IconKey } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { IconContainer } from '@/components/ui';
import { Palette, Radius, Shadows, Spacing, type Tone } from '@/constants/theme';

export type Metric = {
  label: string;
  value: string;
  caption?: string;
  icon: IconKey;
  tone: Tone;
};

/** Card de indicador: ícone pastel, valor e legenda textual. */
export function MetricCard({ metric, loading }: { metric: Metric; loading?: boolean }) {
  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${metric.label}: ${loading ? 'carregando' : metric.value}${metric.caption ? `. ${metric.caption}` : ''}`}>
      <IconContainer icon={metric.icon} tone={metric.tone} size="small" />
      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>{metric.label}</ThemedText>
      <ThemedText type="display">{loading ? '–' : metric.value}</ThemedText>
      {metric.caption ? (
        <ThemedText type="caption" themeColor="textMuted" numberOfLines={2}>{metric.caption}</ThemedText>
      ) : null}
    </View>
  );
}

export function MetricGrid({ metrics, loading }: { metrics: Metric[]; loading?: boolean }) {
  return (
    <View style={styles.grid}>
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} loading={loading} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  card: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.large,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
    ...Shadows.card,
  },
});
