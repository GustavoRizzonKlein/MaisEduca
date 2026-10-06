import { StyleSheet, View } from 'react-native';

import { AppIcon, type AppIconName } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StatusTone = 'information' | 'learning' | 'attention' | 'success' | 'danger' | 'neutral';

const toneTokens: Record<StatusTone, { background: ThemeColor; foreground: ThemeColor }> = {
  information: { background: 'informationSoft', foreground: 'information' },
  learning: { background: 'learningSoft', foreground: 'learning' },
  attention: { background: 'attentionSoft', foreground: 'attention' },
  success: { background: 'successSoft', foreground: 'success' },
  danger: { background: 'dangerSoft', foreground: 'danger' },
  neutral: { background: 'neutralSoft', foreground: 'neutral' },
};

export function StatusBadge({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: StatusTone;
  icon?: AppIconName;
}) {
  const theme = useTheme();
  const colors = toneTokens[tone];
  return (
    <View
      accessibilityRole="text"
      style={[styles.badge, { backgroundColor: theme[colors.background] }]}>
      {icon
        ? <AppIcon name={icon} color={theme[colors.foreground]} size={14} />
        : <View style={[styles.dot, { backgroundColor: theme[colors.foreground] }]} />}
      <ThemedText style={[styles.label, { color: theme[colors.foreground] }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    minHeight: 28,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
