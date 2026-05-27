import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyPayload {
  event_type: string;
  owner_id: string;
  variables: Record<string, string>;
  phone_override?: string; // customer-targeted notifications (e.g. waitlist_available)
}

const PREF_MAP: Record<string, string> = {
  new_order:             'notify_new_order',
  partner_order:         'notify_partner_order',
  customer_signup:       'notify_customer_signup',
  bag_accepted:          'notify_bag_accepted',
  bag_finalized:         'notify_bag_finalized',
  birthday:              'notify_birthday',
  overdue_installment:   'notify_overdue_installment',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body: NotifyPayload = await req.json();
    const { event_type, owner_id, variables, phone_override } = body;

    if (!event_type || !owner_id) {
      return new Response(JSON.stringify({ ok: false, error: 'missing event_type or owner_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Webhook URL global (admin master)
    const { data: configRow } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', 'botconversa_webhook_url')
      .single();

    if (!configRow?.value) {
      return new Response(JSON.stringify({ ok: false, reason: 'webhook_not_configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Resolve destination phone
    let phone: string;

    if (phone_override) {
      // Customer-targeted: skip owner prefs and use the provided phone
      const raw = phone_override.replace(/\D/g, '');
      phone = raw.startsWith('55') ? raw : `55${raw}`;
    } else {
      // Owner-targeted: fetch whatsapp + check pref toggle
      const prefCol = PREF_MAP[event_type];
      const cols = ['whatsapp', prefCol].filter(Boolean).join(', ');

      const { data: settings } = await supabase
        .from('store_settings')
        .select(cols)
        .eq('owner_id', owner_id)
        .single();

      if (!settings?.whatsapp) {
        return new Response(JSON.stringify({ ok: false, reason: 'no_phone' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (prefCol && settings[prefCol] === false) {
        return new Response(JSON.stringify({ ok: false, reason: 'notification_disabled' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const rawPhone = settings.whatsapp.replace(/\D/g, '');
      phone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    }

    // 3. Buscar template e interpolar variáveis → campo mensagem
    const { data: templateRow } = await supabase
      .from('notification_templates')
      .select('template')
      .eq('event_type', event_type)
      .single();

    let mensagem = '';
    if (templateRow?.template) {
      mensagem = templateRow.template.replace(
        /\{\{(\w+)\}\}/g,
        (_: string, key: string) => variables[key] ?? '',
      );
    }

    // 4. POST para BotConversa
    const payload = { phone, mensagem, ...variables };

    const bcRes = await fetch(configRow.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const bcText = await bcRes.text();

    return new Response(
      JSON.stringify({ ok: true, status: bcRes.status, response: bcText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
