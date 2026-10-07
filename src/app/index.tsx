import { Redirect, type Href } from 'expo-router';

import { FullScreenLoading } from '@/components/ui';
import { useAuth } from '@/contexts/auth-context';
import { homeRouteForRole } from '@/types/auth';

export default function IndexScreen() {
  const { user, isLoading, hasInvalidProfile } = useAuth();

  if (isLoading) return <FullScreenLoading />;
  if (hasInvalidProfile) return <Redirect href={'/acesso-negado' as Href} />;
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={homeRouteForRole(user.role)} />;
}
