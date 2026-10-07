import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon, type IconKey } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconContainer } from '@/components/ui/icon-container';
import { Palette, Radius, ScreenPadding, Spacing, Tones, type Tone } from '@/constants/theme';

/** Skeleton discreto para listas e cards em carregamento. */
export function LoadingState({ rows = 3, label = 'Carregando...' }: { rows?: number; label?: string }) {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.skeletonList}>
      {Array.from({ length: rows }, (_, index) => (
        <Animated.View key={index} style={[styles.skeletonCard, pulse]}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, { width: '62%' }]} />
            <View style={[styles.skeletonLine, { width: '38%' }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

/** Carregamento de tela inteira (ex.: sessão sendo restaurada). */
export function FullScreenLoading({ label = 'Carregando seu espaço...' }: { label?: string }) {
  return (
    <View style={styles.fullScreen} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={Palette.bluePrimary} />
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
    </View>
  );
}

type EmptyStateProps = {
  icon?: IconKey;
  tone?: Tone;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  badge?: string;
};

export function EmptyState({ icon = 'book', tone = 'blue', title, description, actionLabel, onAction, badge }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <IconContainer icon={icon} tone={tone} size="large" shape="circle" />
      {badge ? (
        <View style={[styles.inlineBadge, { backgroundColor: Tones.purple.light }]}>
          <AppIcon name="sparkles" color={Tones.purple.ink} size={12} />
          <ThemedText type="caption" style={{ color: Tones.purple.ink, fontWeight: '600' }}>{badge}</ThemedText>
        </View>
      ) : null}
      <ThemedText type="heading" style={styles.centerText}>{title}</ThemedText>
      {description ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>{description}</ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = 'Algo não saiu como esperado',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.empty} accessibilityLiveRegion="polite">
      <IconContainer icon="alert" tone="danger" size="large" shape="circle" />
      <ThemedText type="heading" style={styles.centerText}>{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>{message}</ThemedText>
      {onRetry ? (
        <Button title="Tentar novamente" onPress={onRetry} variant="outline" fullWidth={false} style={styles.emptyAction} />
      ) : null}
    </View>
  );
}

type UnauthorizedStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  homeHref?: Href;
};

/** Tela de acesso não autorizado, reutilizada por qualquer rota protegida. */
export function UnauthorizedState({
  title = 'Acesso não autorizado',
  message = 'Você não tem permissão para acessar esta funcionalidade.\nEntre em contato com a direção caso precise de mais informações.',
  actionLabel = 'Voltar para o início',
  onAction,
  homeHref = '/inicio',
}: UnauthorizedStateProps) {
  return (
    <SafeAreaView style={styles.unauthorized}>
      <View style={styles.decorTop} />
      <View style={styles.decorBottom} />
      <View style={styles.unauthorizedContent}>
        <View style={styles.lockHalo}>
          <IconContainer icon="lock" tone="purple" size="xlarge" shape="circle" />
        </View>
        <ThemedText type="display" style={styles.centerText} accessibilityRole="header">{title}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>{message}</ThemedText>
        <Button
          title={actionLabel}
          icon="home"
          onPress={onAction ?? (() => router.replace(homeHref))}
          style={styles.unauthorizedAction}
        />
      </View>
    </SafeAreaView>
  );
}

type NoticeProps = {
  tone: 'success' | 'error' | 'info';
  message: string;
};

/** Feedback inline discreto (sucesso, erro, informação). */
export function Notice({ tone, message }: NoticeProps) {
  const config = {
    success: { colors: Tones.green, icon: 'checkCircle' as const },
    error: { colors: Tones.danger, icon: 'alert' as const },
    info: { colors: Tones.blue, icon: 'info' as const },
  }[tone];

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: config.colors.light }]}>
      <AppIcon name={config.icon} color={config.colors.ink} size={18} />
      <ThemedText type="small" style={[styles.noticeText, { color: config.colors.ink }]}>{message}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonList: { gap: Spacing.two },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
  },
  skeletonCircle: { width: 44, height: 44, borderRadius: Radius.pill, backgroundColor: '#EEF2F6' },
  skeletonLines: { flex: 1, gap: Spacing.two },
  skeletonLine: { height: 12, borderRadius: Radius.pill, backgroundColor: '#EEF2F6' },
  fullScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, backgroundColor: Palette.background },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.large,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
  },
  inlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    minHeight: 24,
    borderRadius: Radius.pill,
    marginTop: Spacing.one,
  },
  centerText: { textAlign: 'center' },
  emptyAction: { marginTop: Spacing.two },
  unauthorized: { flex: 1, backgroundColor: Palette.background, overflow: 'hidden' },
  unauthorizedContent: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ScreenPadding + Spacing.two,
    gap: Spacing.three,
  },
  lockHalo: {
    padding: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(238, 227, 250, 0.5)',
    marginBottom: Spacing.two,
  },
  unauthorizedAction: { marginTop: Spacing.three },
  decorTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: Radius.pill,
    backgroundColor: Palette.blueLight,
    opacity: 0.6,
  },
  decorBottom: {
    position: 'absolute',
    bottom: -90,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: Radius.pill,
    backgroundColor: Palette.peachLight,
    opacity: 0.55,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  noticeText: { flex: 1, fontWeight: '500' },
});
