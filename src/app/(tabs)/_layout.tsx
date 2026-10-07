import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppIcon, type IconKey } from '@/components/app-icon';
import { Palette, Radius } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { can } from '@/types/auth';

function TabIcon({ icon, focused }: { icon: IconKey; focused: boolean }) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <AppIcon name={icon} color={focused ? Palette.blueInk : Palette.textMuted} size={20} />
    </View>
  );
}

/**
 * Navegação inferior compartilhada por todos os perfis.
 * Abas sem permissão para o perfil atual ficam ocultas (`href: null`).
 */
export default function TabsLayout() {
  const { user } = useAuth();
  const role = user?.role;
  const canViewAgenda = can(role, 'agenda:view');
  const canViewStudents = can(role, 'acompanhamento:view');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.blueInk,
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        sceneStyle: { backgroundColor: Palette.background },
      }}>
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon icon="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          href: canViewAgenda ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon icon="calendar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="alunos"
        options={{
          title: 'Alunos',
          href: canViewStudents ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon icon="students" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="comunicacao"
        options={{
          title: 'Comunicação',
          tabBarIcon: ({ focused }) => <TabIcon icon="message" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon icon="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Palette.surface,
    borderTopColor: Palette.borderSoft,
    borderTopWidth: 1,
    paddingTop: 6,
    elevation: 0,
    boxShadow: '0px -4px 16px rgba(51, 65, 85, 0.04)',
  },
  item: { paddingVertical: 2 },
  label: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  iconPill: { width: 48, height: 28, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  iconPillActive: { backgroundColor: Palette.blueLight },
});
