import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { notifyBotConversa } from '@/utils/notifyBotConversa';
import { Clock, Bell, Trash2, Users, Package, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function WaitlistPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['waitlist', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_waitlist')
        .select('id, customer_name, customer_phone, notified_at, created_at, variant_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const variantIds = [...new Set(entries.map((e) => e.variant_id))];

  const { data: variantDetails = [] } = useQuery({
    queryKey: ['waitlist-variants', variantIds.join(',')],
    enabled: variantIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('product_variants')
        .select('id, size, color, product_id')
        .in('id', variantIds);
      return data || [];
    },
  });

  const productIds = [...new Set(variantDetails.map((v: any) => v.product_id).filter(Boolean))];

  const { data: productsData = [] } = useQuery({
    queryKey: ['waitlist-products', productIds.join(',')],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, image_url')
        .in('id', productIds);
      return data || [];
    },
  });

  const variantMap: Record<string, any> = Object.fromEntries(variantDetails.map((v: any) => [v.id, v]));
  const productMap: Record<string, any> = Object.fromEntries(productsData.map((p: any) => [p.id, p]));

  const notifyMutation = useMutation({
    mutationFn: async ({ entry, variant, product }: any) => {
      await notifyBotConversa(
        'waitlist_available',
        user!.id,
        {
          cliente: entry.customer_name,
          produto: product?.name || 'Produto',
          tamanho: variant?.size || '',
        },
        entry.customer_phone,
      );
      const { error } = await supabase
        .from('product_waitlist')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', entry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast.success('Cliente notificada via WhatsApp!');
    },
    onError: () => toast.error('Erro ao enviar notificação.'),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_waitlist').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast.success('Entrada removida.');
    },
  });

  const grouped = entries.reduce(
    (acc, entry) => {
      const key = entry.variant_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    },
    {} as Record<string, typeof entries>,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-6 w-6 text-yellow-500" /> Fila de Espera
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Clientes que querem ser avisadas quando uma peça em malinha voltar ao estoque.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">Nenhuma cliente na fila de espera</p>
          <p className="text-sm mt-1 opacity-70">
            Quando uma cliente solicitar aviso de uma peça em malinha, aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([variantId, variantEntries]) => {
            const variant = variantMap[variantId];
            const product = variant ? productMap[variant.product_id] : null;
            const pendingCount = variantEntries.filter((e) => !e.notified_at).length;

            return (
              <div key={variantId} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b flex items-center gap-3">
                  {product?.image_url ? (
                    <img
                      src={product.image_url}
                      className="w-12 h-14 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-14 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{product?.name || 'Produto'}</p>
                    <p className="text-sm text-gray-500">
                      Tam: {variant?.size || '—'}
                      {variant?.color ? ` · Cor: ${variant.color}` : ''}
                    </p>
                    {pendingCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold mt-1">
                        <Clock className="h-3 w-3" /> {pendingCount} aguardando aviso
                      </span>
                    )}
                  </div>
                </div>

                <div className="divide-y">
                  {variantEntries.map((entry) => (
                    <div key={entry.id} className="p-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{entry.customer_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {entry.customer_phone}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Registrado em {fmtDate(entry.created_at)}
                        </p>
                        {entry.notified_at && (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold mt-1">
                            ✓ Notificada em {fmtDate(entry.notified_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0 pt-0.5">
                        {!entry.notified_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 h-8"
                            disabled={notifyMutation.isPending}
                            onClick={() =>
                              notifyMutation.mutate({ entry, variant, product })
                            }
                          >
                            <Bell className="h-3.5 w-3.5 mr-1" /> Notificar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          disabled={removeMutation.isPending}
                          onClick={() => removeMutation.mutate(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
