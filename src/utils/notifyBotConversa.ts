import { supabase } from '@/integrations/supabase/client';

export async function notifyBotConversa(
  event_type: string,
  owner_id: string,
  variables: Record<string, string>,
) {
  try {
    await supabase.functions.invoke('notify-botconversa', {
      body: { event_type, owner_id, variables },
    });
  } catch {
    // Notifications are non-critical — silent fail
  }
}
