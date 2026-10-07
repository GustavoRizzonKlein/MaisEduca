import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Shadows, Spacing } from '@/constants/theme';

type ListItemProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
  /** `card` = item isolado com sombra; `plain` = linha dentro de um Card. */
  appearance?: 'card' | 'plain';
  titleColor?: string;
  accessibilityHint?: string;
};

/** Linha de lista padrão (alunos, turmas, menus, comunicados). */
export function ListItem({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  onPress,
  showChevron = Boolean(onPress),
  disabled = false,
  appearance = 'card',
  titleColor,
  accessibilityHint,
}: ListItemProps) {
  const content = (
    <>
      {leading}
      <View style={styles.copy}>
        <ThemedText type="subtitle" numberOfLines={2} style={titleColor ? { color: titleColor } : undefined}>
          {title}
        </ThemedText>
        {subtitle ? <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>{subtitle}</ThemedText> : null}
        {meta ? <ThemedText type="caption" themeColor="textMuted">{meta}</ThemedText> : null}
      </View>
      {trailing}
      {showChevron ? <AppIcon name="chevronRight" color={Palette.textMuted} size={16} /> : null}
    </>
  );

  const containerStyle = [styles.base, appearance === 'card' ? styles.card : styles.plain];

  if (!onPress) return <View style={containerStyle}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, meta].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [containerStyle, pressed && styles.pressed, disabled && styles.disabled]}>
      {content}
    </Pressable>
  );
}

/** Divisor fino entre linhas de um mesmo Card. */
export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 64 },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    ...Shadows.card,
  },
  plain: { paddingVertical: Spacing.two + 2 },
  copy: { flex: 1, gap: Spacing.half },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.55 },
  divider: { height: 1, backgroundColor: Palette.borderSoft },
});
