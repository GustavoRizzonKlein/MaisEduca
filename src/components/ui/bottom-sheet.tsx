import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ThemedText } from '@/components/themed-text';
import { Button, type ButtonVariant } from '@/components/ui/button';
import { IconContainer } from '@/components/ui/icon-container';
import { MinTouchSize, Palette, Radius, ScreenPadding, Spacing, type Tone } from '@/constants/theme';
import type { IconKey } from '@/components/app-icon';

type BottomSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/** Painel inferior padrão (detalhes, formulários, seleção). */
export function BottomSheet({ visible, title, onClose, children, footer }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fechar" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title} accessibilityRole="header">{title}</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.8 }]}>
              <AppIcon name="close" color={Palette.textSecondary} size={18} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  icon?: IconKey;
  tone?: Tone;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirmação de ações (ex.: exclusões). Funciona igual em iOS, Android e web. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  confirmVariant = 'danger',
  icon = 'trash',
  tone = 'pink',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[styles.backdrop, styles.centered]}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <IconContainer icon={icon} tone={tone} size="large" shape="circle" />
          <ThemedText type="heading" style={styles.dialogTitle} accessibilityRole="header">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.dialogMessage}>{message}</ThemedText>
          <View style={styles.dialogActions}>
            <Button title={confirmLabel} variant={confirmVariant} onPress={onConfirm} loading={loading} />
            <Button title="Cancelar" variant="outline" onPress={onCancel} disabled={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: Palette.overlay },
  centered: { justifyContent: 'center', alignItems: 'center', padding: ScreenPadding },
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.xlarge,
    borderTopRightRadius: Radius.xlarge,
    paddingTop: Spacing.two,
    maxHeight: '92%',
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Palette.border,
    marginBottom: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: ScreenPadding,
    paddingBottom: Spacing.two,
  },
  title: { flex: 1 },
  closeButton: {
    width: MinTouchSize - 6,
    height: MinTouchSize - 6,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceSecondary,
    borderWidth: 1,
    borderColor: Palette.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: ScreenPadding, paddingBottom: Spacing.three, gap: Spacing.three },
  footer: { paddingHorizontal: ScreenPadding, paddingTop: Spacing.two, gap: Spacing.two },
  dialog: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Palette.surface,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  dialogTitle: { textAlign: 'center', marginTop: Spacing.two },
  dialogMessage: { textAlign: 'center' },
  dialogActions: { alignSelf: 'stretch', gap: Spacing.two, marginTop: Spacing.three },
});
