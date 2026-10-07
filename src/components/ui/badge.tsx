import { StyleSheet, View } from 'react-native';

import { AppIcon, type IconKey } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Tones, type Tone } from '@/constants/theme';

type BadgeProps = {
  label: string;
  tone?: Tone;
  icon?: IconKey;
  /** Mostra um pequeno ponto colorido antes do texto. */
  dot?: boolean;
};

/**
 * Badge pastel. Sempre exibe texto (nunca depende só da cor) — também usado
 * como StatusBadge para pendente / aprovado / rejeitado / lida etc.
 */
export function Badge({ label, tone = 'neutral', icon, dot = false }: BadgeProps) {
  const colors = Tones[tone];
  return (
    <View accessibilityRole="text" accessibilityLabel={label} style={[styles.badge, { backgroundColor: colors.light }]}>
      {icon ? <AppIcon name={icon} color={colors.ink} size={13} /> : null}
      {!icon && dot ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
      <ThemedText type="caption" style={[styles.label, { color: colors.ink }]} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

export type StatusKind = 'pendente' | 'aprovado' | 'rejeitado' | 'lida' | 'nao-lida' | 'em-breve' | 'hoje';

const statusMap: Record<StatusKind, { label: string; tone: Tone; icon?: IconKey }> = {
  pendente: { label: 'Pendente', tone: 'yellow', icon: 'clock' },
  aprovado: { label: 'Aprovado', tone: 'green', icon: 'checkCircle' },
  rejeitado: { label: 'Rejeitado', tone: 'pink', icon: 'close' },
  lida: { label: 'Lida', tone: 'neutral', icon: 'check' },
  'nao-lida': { label: 'Não lida', tone: 'blue', icon: undefined },
  'em-breve': { label: 'Em breve', tone: 'purple', icon: 'sparkles' },
  hoje: { label: 'Hoje', tone: 'blue', icon: undefined },
};

export function StatusBadge({ status, label }: { status: StatusKind; label?: string }) {
  const config = statusMap[status];
  return <Badge label={label ?? config.label} tone={config.tone} icon={config.icon} dot={!config.icon} />;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 26,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: Radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: Radius.pill },
  label: { fontWeight: '600' },
});
