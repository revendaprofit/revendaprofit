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
         JSON.stringify({ success: false, error: "Não autorizado: " + (userError?.message || 'sem sessão') }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
       );
    }

    const { email, password, full_name, role } = await req.json();

    if (!serviceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "ADMIN_SERVICE_ROLE_KEY não configurada!" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 2. Iniciar cliente ADMIN
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // 3. Criar o usuário na Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });

    if (authError) {
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 4. Atualiza a role na tabela profile
    await supabaseAdmin.from('profiles').update({ role }).eq('id', authData.user.id);

    return new Response(
      JSON.stringify({ user: authData.user, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
