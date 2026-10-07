import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { MaxContentWidth, Palette, ScreenPadding, Spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  /** Conteúdo fixo acima da rolagem (ex.: PageHeader). */
  header?: ReactNode;
  /** Conteúdo sobreposto (ex.: FloatingActionButton). */
  overlay?: ReactNode;
  scroll?: boolean;
  /** Telas dentro das abas não precisam do inset inferior (a tab bar já trata). */
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Estrutura base de toda tela: SafeArea + largura máxima + padding consistente. */
export function Screen({
  children,
  header,
  overlay,
  scroll = true,
  edges = ['top', 'left', 'right'],
  refreshing,
  onRefresh,
  contentStyle,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      {header ? <View style={styles.headerWrap}>{header}</View> : null}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={Palette.bluePrimary} />
            ) : undefined
          }>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
      )}
      {overlay}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Palette.background },
  flex: { flex: 1 },
  headerWrap: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.two,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
});
