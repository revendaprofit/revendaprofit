import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Package, Truck, Clock, CheckCircle, XCircle, ClipboardList, Upload, FileText, 
  CreditCard, Image, Eye, Download, AlertTriangle, ShoppingBag, Copy, Key 
} from 'lucide-react';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  label_ready: { label: 'Etiqueta Pronta', color: 'bg-blue-100 text-blue-700', icon: FileText },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-red-100 text-red-700 border-red-200' },
  sent: { label: 'Comprovante Enviado', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

export default function HubOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLabel, setUploadingLabel] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['hub-my-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hub_fulfillment_orders')
        .select('*, hub_products(name, image_url, brand, category)')
        .eq('tenant_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch supplier names
      if (data && data.length > 0) {
        const supplierIds = [...new Set(data.map((o: any) => o.supplier_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', supplierIds);
        
        // Fetch trade rules for PIX/payment info
        const { data: rules } = await supabase
          .from('hub_trade_rules')
          .select('*')
          .in('supplier_id', supplierIds);

        return data.map((o: any) => {
          const supplier = profiles?.find((p: any) => p.id === o.supplier_id);
          const tradeRule = rules?.find((r: any) => r.supplier_id === o.supplier_id);
          return {
            ...o,
            _supplier_name: supplier?.full_name || supplier?.email || 'Fornecedor',
            _trade_rules: tradeRule
          };
        });
      }
      return data || [];
    },
    enabled: !!user
  });

  // Upload label PDF
  const handleUploadLabel = async (orderId: string, file: File) => {
    if (!user) return;
    setUploadingLabel(orderId);
    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const path = `labels/${user.id}/${orderId}.${ext}`;
      
      const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      
      const { error: updateErr } = await supabase
        .from('hub_fulfillment_orders')
        .update({ label_url: urlData.publicUrl, label_uploaded_at: new Date().toISOString(), status: 'label_ready' })
        .eq('id', orderId);
      if (updateErr) throw updateErr;

      queryClient.invalidateQueries({ queryKey: ['hub-my-orders'] });
      toast.success('Etiqueta enviada ao fornecedor!');
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setUploadingLabel(null);
    }
  };

  // Upload payment proof
  const handleUploadProof = async (orderId: string, file: File) => {
    if (!user) return;
    setUploadingProof(orderId);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `payment-proofs/${user.id}/${orderId}.${ext}`;
      
      const { error: uploadErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      
      const { error: updateErr } = await supabase
        .from('hub_fulfillment_orders')
        .update({ payment_proof_url: urlData.publicUrl, payment_status: 'sent' })
        .eq('id', orderId);
      if (updateErr) throw updateErr;

      queryClient.invalidateQueries({ queryKey: ['hub-my-orders'] });
      toast.success('Comprovante de pagamento enviado!');
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    } finally {
      setUploadingProof(null);
    }
  };

  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('hub_fulfillment_orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-my-orders'] });
      toast.success('Pedido cancelado');
    }
  });

  const deliverMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('hub_fulfillment_orders')
        .update({ status: 'delivered', delivered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hub-my-orders'] });
      toast.success('Entrega confirmada!');
    }
  });

  const filtered = filter === 'all' ? orders : orders.filter((o: any) => o.status === filter);

  const stats = {
    pending: orders.filter((o: any) => o.status === 'pending').length,
    label_ready: orders.filter((o: any) => o.status === 'label_ready').length,
    shipped: orders.filter((o: any) => o.status === 'shipped').length,
    delivered: orders.filter((o: any) => o.status === 'delivered').length,
    total_cost: orders.filter((o: any) => o.status !== 'cancelled')
      .reduce((s: number, o: any) => s + (Number(o.total_wholesale) || 0), 0),
    unpaid: orders.filter((o: any) => o.payment_status === 'pending' && o.status !== 'cancelled')
      .reduce((s: number, o: any) => s + (Number(o.total_wholesale) || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-violet-500/20 rounded-full blur-[60px]"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/10 p-3.5 rounded-2xl border border-white/20 backdrop-blur-sm">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Meus Pedidos Hub</h1>
            <p className="text-violet-200/80 font-medium mt-1">Acompanhe seus pedidos aos fornecedores</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Aguardando</p>
          <p className="text-2xl font-black text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Enviados</p>
          <p className="text-2xl font-black text-purple-600">{stats.shipped}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Custo</p>
          <p className="text-lg font-black text-slate-800">R$ {stats.total_cost.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl border p-4 text-center">
          <p className="text-[10px] font-bold text-red-400 uppercase">A Pagar</p>
          <p className="text-lg font-black text-red-600">R$ {stats.unpaid.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: 'all', label: 'Todos' }, ...Object.entries(statusConfig).map(([key, val]) => ({ key, label: val.label }))].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Carregando pedidos...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border p-16 text-center">
          <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Nenhum pedido</h3>
          <p className="text-sm text-slate-500 mt-2">Quando voce vender produtos do Hub, seus pedidos aparecerao aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order: any) => {
            const sc = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = sc.icon;
            const ps = paymentStatusConfig[order.payment_status] || paymentStatusConfig.pending;
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {/* Main Row */}
                <div className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                  <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {order.hub_products?.image_url ? (
                          <img src={order.hub_products.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-slate-400">{order.order_code || '—'}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.color}`}>
                            <StatusIcon className="w-3 h-3" /> {sc.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ps.color}`}>
                            <CreditCard className="w-3 h-3 inline mr-0.5" /> {ps.label}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{order.hub_products?.name || 'Produto'} x{order.quantity}</p>
                        <p className="text-xs text-slate-500">
                          Fornecedor: <span className="font-bold text-indigo-600">{order._supplier_name}</span>
                          <span className="text-slate-400 ml-2">• {new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Custo Atacado</p>
                        <p className="text-lg font-black text-slate-800">R$ {Number(order.total_wholesale || 0).toFixed(2)}</p>
                      </div>
                      <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t bg-slate-50/50 p-5 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      {/* 1. Pagamento ao Fornecedor */}
                      <div className="bg-white rounded-xl border p-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-amber-500" /> Pagamento ao Fornecedor
                        </h4>
                        
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                          <p className="text-xs text-amber-700">
                            <span className="font-bold">Valor:</span> R$ {Number(order.total_wholesale || 0).toFixed(2)}
                          </p>
                          {order._trade_rules?.notes && (
                            <p className="text-[11px] text-amber-600 mt-1">{order._trade_rules.notes}</p>
                          )}
                        </div>

                        {/* PIX Key */}
                        {order._trade_rules?.pix_key && (
                          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-emerald-600" />
                              <p className="text-[10px] font-bold text-emerald-700 uppercase">Chave PIX do Fornecedor</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-2">
                                <p className="text-[10px] text-emerald-500 uppercase font-bold">
                                  {order._trade_rules.pix_key_type === 'cpf' ? 'CPF' : 
                                   order._trade_rules.pix_key_type === 'cnpj' ? 'CNPJ' : 
                                   order._trade_rules.pix_key_type === 'email' ? 'E-mail' : 
                                   order._trade_rules.pix_key_type === 'telefone' ? 'Telefone' : 'Chave Aleatória'}
                                </p>
                                <p className="text-sm font-mono font-bold text-emerald-800 select-all">{order._trade_rules.pix_key}</p>
                              </div>
                              <button
                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-lg transition-colors flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(order._trade_rules.pix_key);
                                  toast.success('Chave PIX copiada!');
                                }}
                                title="Copiar chave PIX"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {order.payment_status === 'pending' && (
                          <>
                            <p className="text-[11px] text-slate-500">Envie o comprovante de pagamento (PIX, transferencia, etc):</p>
                            <input
                              ref={proofInputRef}
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadProof(order.id, f);
                              }}
                            />
                            <Button
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs h-9 rounded-lg"
                              disabled={uploadingProof === order.id}
                              onClick={() => proofInputRef.current?.click()}
                            >
                              {uploadingProof === order.id ? 'Enviando...' : (
                                <><Image className="w-3.5 h-3.5 mr-1.5" /> Enviar Comprovante</>
                              )}
                            </Button>
                          </>
                        )}

                        {order.payment_status === 'sent' && (
                          <div className="bg-amber-50 border-amber-200 border rounded-lg p-2 text-center">
                            <p className="text-xs text-amber-700 font-bold">Aguardando confirmacao do fornecedor</p>
                          </div>
                        )}

                        {order.payment_status === 'confirmed' && (
                          <div className="bg-emerald-50 border-emerald-200 border rounded-lg p-2 text-center">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                            <p className="text-xs text-emerald-700 font-bold">Pagamento confirmado!</p>
                          </div>
                        )}

                        {order.payment_proof_url && (
                          <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Ver comprovante
                          </a>
                        )}
                      </div>

                      {/* 2. Etiqueta de Envio */}
                      <div className="bg-white rounded-xl border p-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" /> Etiqueta de Envio
                        </h4>
                        
                        {order.customer_name && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs space-y-0.5">
                            <p className="font-bold text-blue-800">Destinatario:</p>
                            <p>{order.customer_name}</p>
                            {order.customer_phone && <p>Tel: {order.customer_phone}</p>}
                            {order.customer_address && <p>{order.customer_address}</p>}
                            {order.customer_city && <p>{order.customer_city}/{order.customer_state} - {order.customer_zip}</p>}
                          </div>
                        )}

                        {!order.label_url ? (
                          <>
                            <p className="text-[11px] text-slate-500">Envie a etiqueta (PDF ou imagem) para o fornecedor despachar:</p>
                            <input
                              ref={labelInputRef}
                              type="file"
                              accept=".pdf,image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadLabel(order.id, f);
                              }}
                            />
                            <Button
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs h-9 rounded-lg"
                              disabled={uploadingLabel === order.id}
                              onClick={() => labelInputRef.current?.click()}
                            >
                              {uploadingLabel === order.id ? 'Enviando...' : (
                                <><Upload className="w-3.5 h-3.5 mr-1.5" /> Enviar Etiqueta</>
                              )}
                            </Button>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className="bg-emerald-50 border-emerald-200 border rounded-lg p-2 text-center">
                              <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                              <p className="text-xs text-emerald-700 font-bold">Etiqueta enviada!</p>
                              <p className="text-[10px] text-emerald-500">{new Date(order.label_uploaded_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <a href={order.label_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 justify-center">
                              <Download className="w-3 h-3" /> Ver/Baixar etiqueta
                            </a>
                            {/* Reenviar */}
                            <input type="file" accept=".pdf,image/*" className="hidden" id={`relabel-${order.id}`}
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadLabel(order.id, f); }} />
                            <button className="text-[10px] text-slate-400 hover:text-slate-600 w-full text-center"
                              onClick={() => (document.getElementById(`relabel-${order.id}`) as HTMLInputElement)?.click()}>
                              Substituir etiqueta
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 3. Status e Rastreio */}
                      <div className="bg-white rounded-xl border p-4 space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                          <Truck className="w-4 h-4 text-purple-500" /> Status do Envio
                        </h4>

                        {/* Timeline */}
                        <div className="space-y-2">
                          {[
                            { key: 'pending', label: 'Pedido Criado', date: order.created_at, done: true },
                            { key: 'payment', label: 'Pagamento', date: order.payment_status === 'confirmed' ? order.payment_confirmed_at : null, done: order.payment_status !== 'pending' },
                            { key: 'label', label: 'Etiqueta Enviada', date: order.label_uploaded_at, done: !!order.label_url },
                            { key: 'shipped', label: 'Produto Despachado', date: order.shipped_at, done: !!order.shipped_at },
                            { key: 'delivered', label: 'Entregue', date: order.delivered_at, done: !!order.delivered_at },
                          ].map((step, i) => (
                            <div key={step.key} className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                {step.done ? '✓' : i + 1}
                              </div>
                              <div className="flex-1">
                                <p className={`text-xs font-bold ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                              </div>
                              {step.date && <span className="text-[10px] text-slate-400">{new Date(step.date).toLocaleDateString('pt-BR')}</span>}
                            </div>
                          ))}
                        </div>

                        {order.tracking_code && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                            <p className="text-[10px] text-purple-500 font-bold uppercase">Codigo de Rastreio:</p>
                            <p className="text-sm font-mono font-bold text-purple-800">{order.tracking_code}</p>
                          </div>
                        )}

                        {order.status === 'shipped' && (
                          <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-9 rounded-lg"
                            onClick={(e) => { e.stopPropagation(); if (confirm('Confirmar que o produto foi entregue?')) deliverMutation.mutate(order.id); }}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Confirmar Entrega
                          </Button>
                        )}

                        {order.status === 'pending' && (
                          <Button variant="outline" size="sm" className="w-full text-xs text-red-500 border-red-200 hover:bg-red-50 h-8"
                            onClick={(e) => { e.stopPropagation(); if (confirm('Cancelar este pedido?')) cancelMutation.mutate(order.id); }}>
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar Pedido
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Warning if missing steps */}
                    {order.status === 'pending' && (!order.label_url || order.payment_status === 'pending') && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-amber-800">Acoes necessarias para despacho:</p>
                          <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
                            {order.payment_status === 'pending' && <li>• Envie o comprovante de pagamento ao fornecedor</li>}
                            {!order.label_url && <li>• Envie a etiqueta de envio (PDF) para o fornecedor despachar</li>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
