import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const MANAGED_ROLES = ["professor", "professor_apoio", "responsavel"] as const;
type ManagedRole = (typeof MANAGED_ROLES)[number];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isManagedRole(value: unknown): value is ManagedRole {
  return typeof value === "string" && (MANAGED_ROLES as readonly string[]).includes(value);
}

async function clearAssociations(
  admin: ReturnType<typeof createClient>,
  userId: string,
) {
  await admin.from("professor_turmas").delete().eq("professor_id", userId);
  await admin.from("professor_apoio_alunos").delete().eq("professor_id", userId);
  await admin.from("responsavel_alunos").delete().eq("responsavel_id", userId);
}

async function upsertProfile(
  admin: ReturnType<typeof createClient>,
  profile: { id: string; nome: string; email: string; role: string },
) {
  const { error } = await admin.from("profiles").upsert(profile);
  if (error) {
    throw new Error(`Falha ao sincronizar perfil: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SB_PUBLISHABLE_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SB_SECRET_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Configuração do servidor incompleta." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autenticado." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) {
      return json({ error: "Sessão inválida." }, 401);
    }

    const callerRole = userData.user.app_metadata?.role;
    if (callerRole !== "direcao") {
      return json({ error: "Apenas a Direção pode gerenciar usuários." }, 403);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const action = (body as { action?: string }).action ?? new URL(req.url).searchParams.get("action");

    if (action === "list") {
      const { data, error } = await admin
        .from("profiles")
        .select("id, nome, email, role, created_at, updated_at")
        .neq("role", "direcao")
        .order("nome");
      if (error) return json({ error: error.message }, 400);
      return json({ users: data ?? [] });
    }

    if (action === "create") {
      const { nome, email, senha, role } = body as {
        nome?: string;
        email?: string;
        senha?: string;
        role?: string;
      };

      if (!nome?.trim() || !email?.trim() || !senha || !isManagedRole(role)) {
        return json({ error: "Informe nome, e-mail, senha e um perfil gerenciável." }, 400);
      }

      const { data, error } = await admin.rpc("create_managed_auth_user", {
        p_email: email.trim().toLowerCase(),
        p_password: senha,
        p_nome: nome.trim(),
        p_role: role,
      });

      if (error) {
        return json({ error: error.message }, 400);
      }

      const created = Array.isArray(data) ? data[0] : data;
      if (!created?.user_id) {
        return json({ error: "Não foi possível criar o usuário." }, 400);
      }

      const { error: resetError } = await admin.auth.resetPasswordForEmail(
        created.user_email ?? email.trim().toLowerCase(),
      );

      return json({
        user: {
          id: created.user_id,
          nome: created.user_nome ?? nome.trim(),
          email: created.user_email,
          role: created.user_role ?? role,
        },
        passwordResetEmailSent: !resetError,
        passwordResetWarning: resetError?.message,
      });
    }

    if (action === "update") {
      const { id, nome, email, role, senha } = body as {
        id?: string;
        nome?: string;
        email?: string;
        role?: string;
        senha?: string;
      };

      if (!id) return json({ error: "Informe o id do usuário." }, 400);

      const { data: existing, error: existingError } = await admin
        .from("profiles")
        .select("id, role, nome, email")
        .eq("id", id)
        .maybeSingle();

      if (existingError || !existing) {
        return json({ error: "Usuário não encontrado." }, 404);
      }
      if (existing.role === "direcao") {
        return json({ error: "A conta da Direção não faz parte deste fluxo." }, 400);
      }
      if (role !== undefined && !isManagedRole(role)) {
        return json({ error: "Perfil inválido." }, 400);
      }

      const updates: {
        email?: string;
        password?: string;
        user_metadata?: { nome: string };
        app_metadata?: { role: ManagedRole };
      } = {};

      if (nome?.trim()) updates.user_metadata = { nome: nome.trim() };
      if (email?.trim()) updates.email = email.trim().toLowerCase();
      if (senha) updates.password = senha;
      if (isManagedRole(role)) updates.app_metadata = { role };

      const { data, error } = await admin.auth.admin.updateUserById(id, updates);
      if (error || !data.user) {
        return json({ error: error?.message ?? "Não foi possível atualizar o usuário." }, 400);
      }

      const nextRole = isManagedRole(role) ? role : existing.role;
      if (isManagedRole(role) && role !== existing.role) {
        await clearAssociations(admin, id);
      }

      try {
        await upsertProfile(admin, {
          id,
          nome: nome?.trim() || existing.nome,
          email: data.user.email ?? existing.email,
          role: nextRole,
        });
      } catch (profileError) {
        await admin.auth.admin.updateUserById(id, {
          email: existing.email,
          user_metadata: { nome: existing.nome },
          app_metadata: { role: existing.role as ManagedRole },
        }).catch(() => undefined);
        const message = profileError instanceof Error ? profileError.message : "Falha ao sincronizar perfil.";
        return json({ error: message }, 500);
      }

      return json({
        user: {
          id,
          nome: nome?.trim() || existing.nome,
          email: data.user.email,
          role: nextRole,
        },
      });
    }

    if (action === "delete") {
      const { id } = body as { id?: string };
      if (!id) return json({ error: "Informe o id do usuário." }, 400);

      const { data: existing, error: existingError } = await admin
        .from("profiles")
        .select("id, role")
        .eq("id", id)
        .maybeSingle();

      if (existingError || !existing) {
        return json({ error: "Usuário não encontrado." }, 404);
      }
      if (existing.role === "direcao") {
        return json({ error: "A conta da Direção não pode ser excluída por este fluxo." }, 400);
      }

      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "send_password_reset") {
      const { email } = body as { email?: string };
      if (!email?.trim()) return json({ error: "Informe o e-mail." }, 400);
      const { error } = await admin.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado.";
    return json({ error: message }, 500);
  }
});
