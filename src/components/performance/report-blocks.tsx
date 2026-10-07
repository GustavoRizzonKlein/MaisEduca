import type { ReactNode } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, Button, Card, Divider } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { formatPeriodLabel } from '@/lib/periods';
import type { ReportPeriod } from '@/types/performance';

/** Cabeçalho do relatório: título, assunto e período. */
export function ReportHeader({ title, subject, period }: { title: string; subject: string; period: ReportPeriod }) {
  return (
    <Card style={styles.header}>
      <Badge label={title} tone="purple" icon="notes" />
      <ThemedText type="title">{subject}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">Período: {formatPeriodLabel(period)}</ThemedText>
      <ThemedText type="caption" themeColor="textMuted">Gerado em {new Date().toLocaleString('pt-BR')}</ThemedText>
    </Card>
  );
}

export function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card style={styles.section}>
      <ThemedText type="heading" accessibilityRole="header">{title}</ThemedText>
      {children}
    </Card>
  );
}

/** Linha rótulo/valor de uma tabela simples. */
export function ReportRow({ label, value, detail, last }: { label: string; value: string; detail?: string; last?: boolean }) {
  return (
    <>
      <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}${detail ? `, ${detail}` : ''}`}>
        <View style={styles.rowLabel}>
          <ThemedText type="small">{label}</ThemedText>
          {detail ? <ThemedText type="caption" themeColor="textMuted">{detail}</ThemedText> : null}
        </View>
        <ThemedText type="smallBold">{value}</ThemedText>
      </View>
      {!last ? <Divider /> : null}
    </>
  );
}

/** Exporta o relatório como texto pelo menu de compartilhamento nativo. */
export function ShareReportButton({ title, buildText, disabled }: { title: string; buildText: () => string; disabled?: boolean }) {
  return (
    <Button
      title="Compartilhar relatório"
      icon="share"
      variant="secondary"
      disabled={disabled}
      onPress={() => {
        void Share.share({ title, message: buildText() }).catch(() => undefined);
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one + 2 },
  section: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 44, paddingVertical: Spacing.one },
  rowLabel: { flex: 1, gap: Spacing.half },
});
