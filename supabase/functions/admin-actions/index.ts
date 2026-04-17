import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('ADMIN_SERVICE_ROLE_KEY') ?? '';

    // 1. Validar usuário autenticado
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { action, target_user_id, target_email } = await req.json();

    if (!serviceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "ADMIN_SERVICE_ROLE_KEY não configurada!" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // ============================================
    // ACTION: RESET PASSWORD
    // ============================================
    if (action === 'reset_password') {
      if (!target_email) {
        return new Response(
          JSON.stringify({ success: false, error: "Email do usuário não informado." }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Gera link de redefinição de senha via Admin API
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: target_email,
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Link de redefinição gerado com sucesso!",
          recovery_link: data?.properties?.action_link || null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ============================================
    // ACTION: DELETE USER (WIPE TOTAL)
    // ============================================
    if (action === 'delete_user') {
      if (!target_user_id) {
        return new Response(
          JSON.stringify({ success: false, error: "ID do usuário não informado." }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Prevenir auto-exclusão
      if (target_user_id === user.id) {
        return new Response(
          JSON.stringify({ success: false, error: "Você não pode excluir a si mesmo!" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Deleta da Auth (cascade remove profiles via trigger)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Conta excluída permanentemente." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Ação desconhecida: " + action }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
