import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const CONFIG_ERROR =
  'Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY para conectar ao projeto Supabase.';

let client: SupabaseClient | null = null;

/**
 * Cliente Supabase compartilhado (lazy).
 * Falha só na primeira uso se as env vars estiverem ausentes — tratável pelo AuthContext.
 * Próximas tarefas devem importar getSupabase() daqui — não criar outro createClient.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(CONFIG_ERROR);
  }

  client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return client;
}
