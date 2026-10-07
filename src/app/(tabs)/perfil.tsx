import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  Avatar,
  Badge,
  Card,
  ConfirmDialog,
  Divider,
  IconContainer,
  ListItem,
  Notice,
  PageHeader,
  Screen,
  StatusBadge,
} from '@/components/ui';
import { Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { roleLabel } from '@/types/auth';

type Expanded = 'dados' | 'ajuda' | null;

export default function PerfilScreen() {
  const { user, logout, requestPasswordReset } = useAuth();
  const [expanded, setExpanded] = useState<Expanded>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  if (!user) return null;

  async function handlePasswordReset() {
    if (!user) return;
    setBusy(true);
    setFeedback(null);
    try {
      await requestPasswordReset(user.email);
      setFeedback({ tone: 'success', message: `Enviamos um link para ${user.email} com as instruções para criar uma nova senha.` });
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Não foi possível enviar o e-mail.' });
    } finally {
      setBusy(false);
      setConfirmReset(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    await logout();
    setBusy(false);
    setConfirmLogout(false);
  }

  const toggle = (value: Exclude<Expanded, null>) => setExpanded((current) => (current === value ? null : value));

  return (
    <Screen header={<PageHeader title="Meu perfil" />}>
      <View style={styles.identity}>
        <Avatar name={user.nome} size="large" />
        <ThemedText type="title" style={styles.center}>{user.nome}</ThemedText>
        <Badge label={roleLabel(user.role)} tone="blue" icon="profile" />
      </View>

      {feedback ? <Notice tone={feedback.tone} message={feedback.message} /> : null}

      <Card padded={false} style={styles.menu}>
        <MenuRow icon="student" tone="blue" title="Meus dados" onPress={() => toggle('dados')} />
        {expanded === 'dados' ? (
          <View style={styles.expanded}>
            <InfoLine label="Nome" value={user.nome} />
            <InfoLine label="E-mail" value={user.email} />
            <InfoLine label="Perfil" value={roleLabel(user.role)} />
            <ThemedText type="caption" themeColor="textMuted">
              Para alterar seus dados, procure a Direção da escola.
            </ThemedText>
          </View>
        ) : null}
        <Divider />
        <MenuRow icon="lock" tone="purple" title="Alterar senha" subtitle="Receba um link por e-mail" onPress={() => setConfirmReset(true)} />
        <Divider />
        <MenuRow
          icon="bell"
          tone="yellow"
          title="Notificações"
          trailing={<StatusBadge status="em-breve" />}
          disabled
        />
        <Divider />
        <MenuRow icon="help" tone="green" title="Ajuda" onPress={() => toggle('ajuda')} />
        {expanded === 'ajuda' ? (
          <View style={styles.expanded}>
            <ThemedText type="small" themeColor="textSecondary">
              As contas, turmas e vínculos entre alunos, professores e responsáveis são gerenciados pela Direção.
              Em caso de dúvidas sobre acesso ou dados, entre em contato com a secretaria da escola.
            </ThemedText>
          </View>
        ) : null}
      </Card>

      <Card padded={false} style={styles.menu}>
        <ListItem
          appearance="plain"
          title="Sair"
          titleColor={Palette.errorInk}
          leading={<IconContainer icon="logout" tone="pink" size="small" />}
          showChevron={false}
          onPress={() => setConfirmLogout(true)}
        />
      </Card>

      <ConfirmDialog
        visible={confirmReset}
        icon="mail"
        tone="purple"
        title="Alterar senha?"
        message={`Enviaremos um link para ${user.email} para você criar uma nova senha.`}
        confirmLabel="Enviar link"
        confirmVariant="primary"
        loading={busy}
        onConfirm={handlePasswordReset}
        onCancel={() => setConfirmReset(false)}
      />
      <ConfirmDialog
        visible={confirmLogout}
        icon="logout"
        title="Sair da conta?"
        message="Você precisará entrar novamente com seu e-mail e senha."
        confirmLabel="Sair"
        loading={busy}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </Screen>
  );
}

function MenuRow({
  icon,
  tone,
  title,
  subtitle,
  trailing,
  disabled,
  onPress,
}: {
  icon: 'student' | 'lock' | 'bell' | 'help';
  tone: 'blue' | 'purple' | 'yellow' | 'green';
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <ListItem
      appearance="plain"
      title={title}
      subtitle={subtitle}
      leading={<IconContainer icon={icon} tone={tone} size="small" />}
      trailing={trailing}
      disabled={disabled}
      showChevron={!disabled}
      onPress={disabled ? undefined : onPress}
    />
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <ThemedText type="caption" themeColor="textMuted">{label}</ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: Spacing.two },
  center: { textAlign: 'center' },
  menu: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  expanded: { gap: Spacing.two, paddingBottom: Spacing.three, paddingLeft: 32 + Spacing.three },
  infoLine: { gap: Spacing.half },
});
