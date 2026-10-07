import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, EmptyState, PageHeader, Screen, SegmentedControl, StatusBadge } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { canApproveComunicados } from '@/types/auth';

type Section = 'mensagens' | 'comunicados';

/**
 * Estrutura visual do módulo de Comunicação.
 * ⚠️ Ainda não existe backend (tabelas/RLS) para mensagens e comunicados no
 * Supabase — por isso nenhuma lista é exibida e nada é simulado aqui.
 */
export default function ComunicacaoScreen() {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>('comunicados');
  const canApprove = user ? canApproveComunicados(user.role) : false;

  return (
    <Screen
      header={
        <PageHeader title="Comunicação" subtitle="Mensagens e comunicados da escola">
          <SegmentedControl
            value={section}
            onChange={setSection}
            options={[
              { value: 'mensagens', label: 'Mensagens' },
              { value: 'comunicados', label: 'Comunicados' },
            ]}
          />
        </PageHeader>
      }>
      {section === 'comunicados' ? (
        <EmptyState
          icon="megaphone"
          tone="peach"
          badge="Em breve"
          title="Comunicados ainda não disponíveis"
          description={
            canApprove
              ? 'Aqui a Direção poderá revisar, aprovar ou rejeitar os comunicados enviados pela equipe antes que cheguem às famílias.'
              : 'Aqui você verá os comunicados da escola, com autor, data e confirmação de leitura.'
          }
        />
      ) : (
        <EmptyState
          icon="message"
          tone="blue"
          badge="Em breve"
          title="Mensagens ainda não disponíveis"
          description="Aqui ficarão as mensagens trocadas entre a escola e as famílias, com destinatários e estado de leitura."
        />
      )}

      <Card style={styles.legend}>
        <ThemedText type="subtitle">Como os comunicados serão sinalizados</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Cada comunicado terá um estado visível, sempre com texto além da cor:
        </ThemedText>
        <View style={styles.badges}>
          <StatusBadge status="pendente" label="Pendente de aprovação" />
          <StatusBadge status="aprovado" />
          <StatusBadge status="rejeitado" />
          <StatusBadge status="nao-lida" />
          <StatusBadge status="lida" />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  legend: { gap: Spacing.two },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
});
