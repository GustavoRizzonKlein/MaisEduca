import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon, type IconKey } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { MinTouchSize, Palette, Radius, Spacing } from '@/constants/theme';

type HeaderAction = {
  icon: IconKey;
  accessibilityLabel: string;
  onPress: () => void;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Mostra o botão voltar. Se não houver histórico, navega para `backFallback`. */
  showBack?: boolean;
  backFallback?: Href;
  onBack?: () => void;
  action?: HeaderAction;
  children?: ReactNode;
};

/** Cabeçalho padrão das telas: voltar, título, subtítulo e ação opcional. */
export function PageHeader({ title, subtitle, showBack = false, backFallback = '/inicio', onBack, action, children }: PageHeaderProps) {
  function handleBack() {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace(backFallback);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {showBack ? <IconButton icon="chevronLeft" accessibilityLabel="Voltar" onPress={handleBack} /> : null}
        <View style={styles.copy}>
          <ThemedText type="title" accessibilityRole="header" numberOfLines={2}>{title}</ThemedText>
          {subtitle ? <ThemedText type="small" themeColor="textSecondary">{subtitle}</ThemedText> : null}
        </View>
        {action ? <IconButton {...action} /> : null}
      </View>
      {children}
    </View>
  );
}

export function IconButton({ icon, accessibilityLabel, onPress }: HeaderAction) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <AppIcon name={icon} color={Palette.textPrimary} size={18} />
    </Pressable>
  );
}

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

/** Título de seção com link de ação opcional ("Ver todas"). */
export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View style={styles.sectionRow}>
      <ThemedText type="heading" accessibilityRole="header" style={styles.sectionTitle}>{title}</ThemedText>
      {actionLabel && onActionPress ? (
        <Pressable accessibilityRole="button" onPress={onActionPress} hitSlop={8} style={styles.sectionAction}>
          <ThemedText type="link">{actionLabel}</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three, paddingBottom: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: MinTouchSize },
  copy: { flex: 1, gap: Spacing.half },
  iconButton: {
    width: MinTouchSize,
    height: MinTouchSize,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  sectionTitle: { flex: 1 },
  sectionAction: { minHeight: MinTouchSize, justifyContent: 'center' },
});
