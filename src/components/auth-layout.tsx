import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BrandLogo, IconContainer } from '@/components/ui';
import type { IconKey } from '@/components/app-icon';
import { Palette, Radius, ScreenPadding, Spacing, type Tone } from '@/constants/theme';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  /** Mostra a marca (login) ou um ícone ilustrativo (recuperação, nova senha). */
  showLogo?: boolean;
  icon?: IconKey;
  iconTone?: Tone;
  children: ReactNode;
  footer?: ReactNode;
};

/** Estrutura visual das telas de autenticação, com detalhes pastel sutis ao fundo. */
export function AuthLayout({ title, subtitle, showLogo = false, icon = 'lock', iconTone = 'blue', children, footer }: AuthLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.blob, styles.blobBlue]} />
      <View style={[styles.blob, styles.blobYellow]} />
      <View style={[styles.blob, styles.blobGreen]} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(420)} style={styles.inner}>
            <View style={styles.header}>
              {showLogo ? <BrandLogo /> : <IconContainer icon={icon} tone={iconTone} size="xlarge" shape="circle" />}
              <View style={styles.titles}>
                <ThemedText type="display" style={styles.center} accessibilityRole="header">{title}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.center}>{subtitle}</ThemedText>
              </View>
            </View>
            <View style={styles.form}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background, overflow: 'hidden' },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: ScreenPadding, paddingVertical: Spacing.five },
  inner: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: Spacing.five },
  header: { alignItems: 'center', gap: Spacing.four },
  titles: { gap: Spacing.two, alignItems: 'center' },
  center: { textAlign: 'center' },
  form: { gap: Spacing.three },
  footer: { alignItems: 'center', gap: Spacing.two },
  blob: { position: 'absolute', borderRadius: Radius.pill, pointerEvents: 'none' },
  blobBlue: { width: 260, height: 260, top: -110, right: -90, backgroundColor: Palette.blueLight, opacity: 0.7 },
  blobYellow: { width: 120, height: 120, top: 120, left: -60, backgroundColor: Palette.yellowLight, opacity: 0.8 },
  blobGreen: { width: 280, height: 280, bottom: -150, left: -40, backgroundColor: Palette.greenLight, opacity: 0.6 },
});
