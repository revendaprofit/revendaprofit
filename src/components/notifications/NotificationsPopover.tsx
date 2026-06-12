import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Bell, Check, Trash2, PackageOpen, ShoppingBag, Truck, Info, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function NotificationsPopover() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20)
        
      if (error) throw error
      return data
    },
    enabled: !!user,
    refetchInterval: 30000
  });

  // === AUTO-DISMISS: marca como lida notificações cujas entidades já foram resolvidas ===
  const autoDismiss = useCallback(async () => {
    if (!user?.id || notifications.length === 0) return;
    
    const unread = notifications.filter(n => !n.is_read && n.related_entity_id);
    if (unread.length === 0) return;

    const idsToMarkRead: string[] = [];

    // Agrupar por tipo para otimizar queries
    const bagNotifs = unread.filter(n => n.type === 'bag_answered' || n.type === 'bag_answered_with_exchange');
    const bazarNotifs = unread.filter(n => n.type === 'bazar_new_item');

    // Bolsas Consignadas: resolvida se status != 'pending_approval'
    if (bagNotifs.length > 0) {
      const bagIds = bagNotifs.map(n => n.related_entity_id);
      const { data: bags } = await supabase.from('consignment_bags').select('id, status').in('id', bagIds);
      bags?.forEach(bag => {
        if (bag.status !== 'pending_approval' && bag.status !== 'with_customer') {
          const notif = bagNotifs.find(n => n.related_entity_id === bag.id);
          if (notif) idsToMarkRead.push(notif.id);
        }
      });
    }

    // Bazar VIP: resolvida se status != 'pending'
    if (bazarNotifs.length > 0) {
      const bazarIds = bazarNotifs.map(n => n.related_entity_id);
      const { data: items } = await supabase.from('bazar_items').select('id, status').in('id', bazarIds);
      items?.forEach(item => {
        if (item.status !== 'pending') {
          const notif = bazarNotifs.find(n => n.related_entity_id === item.id);
          if (notif) idsToMarkRead.push(notif.id);
        }
      });
    }

    // Marcar como lidas em batch
    if (idsToMarkRead.length > 0) {
      await supabase.from('notifications').update({ is_read: true }).in('id', idsToMarkRead);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  }, [user?.id, notifications, queryClient]);

  useEffect(() => {
    autoDismiss();
  }, [autoDismiss]);

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await supabase.from('notifications').update({ is_read: true }).eq('owner_id', user?.id).eq('is_read', false)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'hub_order_update': return <Truck className="w-4 h-4 text-amber-500" />;
      case 'new_hub_product': return <ShoppingBag className="w-4 h-4 text-indigo-500" />;
      case 'bag_answered':
      case 'bag_answered_with_exchange': return <ShoppingBag className="w-4 h-4 text-rose-500" />;
      case 'bazar_new_item': return <Sparkles className="w-4 h-4 text-purple-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative group hover:bg-slate-200" onClick={() => setOpen(!open)}>
        <Bell className="h-5 w-5 text-slate-600 transition-transform group-hover:scale-110" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-4 w-4 shrink-0 translate-x-1 -translate-y-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-[0_0_0_2px_#fff]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 bg-white shadow-2xl rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
               <div>
                  <h3 className="font-bold text-sm tracking-tight text-slate-900">Avisos</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Você tem {unreadCount} novos avisos.</p>
               </div>
               {unreadCount > 0 && (
                 <Button variant="ghost" size="sm" className="h-8 text-[11px] font-semibold text-primary hover:text-primary" onClick={() => markAllAsRead.mutate()}>
                   Marcar lidas
                 </Button>
               )}
            </div>
            
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar flex-1">
           {notifications.length === 0 ? (
             <div className="p-8 text-center flex flex-col items-center">
                <Bell className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-sm font-medium text-slate-400">Nenhum aviso no momento</p>
             </div>
           ) : (
             <div className="divide-y divide-slate-50">
                {notifications.map(n => (
                  <div 
                     key={n.id} 
                     className={`p-4 flex gap-3 group cursor-pointer transition-colors ${!n.is_read ? 'bg-indigo-50/30 hover:bg-indigo-50/60' : 'hover:bg-slate-50'}`}
                     onClick={() => {
                        if (!n.is_read) markAsRead.mutate(n.id);
                        if (n.link) {
                            setOpen(false);
                            navigate(n.link);
                        }
                     }}
                  >
                     <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${!n.is_read ? 'bg-white shadow-sm border border-indigo-100' : 'bg-slate-100 border border-slate-200'}`}>
                        {getIcon(n.type)}
                     </div>
                     <div className="flex-1 space-y-1">
                        <p className={`text-xs ${!n.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>{n.title}</p>
                        <p className="text-[11px] leading-tight text-slate-500 line-clamp-2">{n.message}</p>
                     </div>
                     {!n.is_read && (
                        <div className="w-2 h-2 shrink-0 rounded-full bg-primary mt-1" />
                     )}
                  </div>
                ))}
             </div>
           )}
        </div>
          </div>
        </>
      )}
    </div>
  )
}
