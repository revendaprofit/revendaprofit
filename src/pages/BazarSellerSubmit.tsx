import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Sparkles, Camera, Package, MapPin, CheckCircle, Clock, XCircle, Upload, ArrowRight, LogIn, ShoppingBag } from 'lucide-react';

export default function BazarSellerSubmit() {
  const { storeSlug } = useParams();
  const queryClient = useQueryClient();

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authProcessing, setAuthProcessing] = useState(false);

  // Address state
  const [addressForm, setAddressForm] = useState({ cep: '', street: '', address_number: '', neighborhood: '', city: '', state: '' });
  const [cepLoading, setCepLoading] = useState(false);

  // Submission state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerPrice, setCustomerPrice] = useState('');
  const [condition, setCondition] = useState('used');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch store
  const { data: store } = useQuery({
    queryKey: ['bazar-store', storeSlug],
    queryFn: async () => {
      const { data, error } = await supabase.from('store_settings').select('*').eq('slug', storeSlug).single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeSlug
  });

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Profile (address check)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['bazar-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      return data;
    }
  });

  // User's bazar items
  const { data: myItems = [] } = useQuery({
    queryKey: ['my-bazar-items', user?.id, store?.owner_id],
    enabled: !!user?.id && !!store?.owner_id,
    queryFn: async () => {
      const { data } = await supabase.from('bazar_items').select('*').eq('seller_id', user.id).eq('owner_id', store.owner_id).order('created_at', { ascending: false });
      return data || [];
    }
  });

  // Subcategories from "Bazar VIP" category
  const { data: bazarCategory } = useQuery({
    queryKey: ['bazar-vip-category', store?.owner_id],
    enabled: !!store?.owner_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, subcategories(id, name)')
        .eq('owner_id', store.owner_id)
        .ilike('name', 'Bazar VIP')
        .single();
      return data;
    }
  });

  const bazarSubcategories = bazarCategory?.subcategories || [];

  const hasAddress = profile?.cep && profile?.street && profile?.city;

  // Auth handler
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthProcessing(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { full_name: authName } } });
        if (error) throw error;
        // Update role
        const session = (await supabase.auth.getSession()).data.session;
        if (session?.user) {
          await supabase.from('profiles').update({ role: 'bazar_seller', full_name: authName }).eq('id', session.user.id);
        }
        toast.success('Conta criada com sucesso!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        toast.success('Login realizado!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro na autenticação');
    } finally {
      setAuthProcessing(false);
    }
  };

  // CEP lookup
  const lookupCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddressForm(prev => ({ ...prev, cep: cleanCep, street: data.logradouro || '', neighborhood: data.bairro || '', city: data.localidade || '', state: data.uf || '' }));
      } else {
        toast.error('CEP não encontrado');
      }
    } catch { toast.error('Erro ao buscar CEP'); }
    finally { setCepLoading(false); }
  };

  // Save address
  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.cep || !addressForm.street || !addressForm.address_number || !addressForm.city) {
      return toast.error('Preencha todos os campos obrigatórios');
    }
    const { error } = await supabase.from('profiles').update(addressForm).eq('id', user.id);
    if (error) { toast.error('Erro ao salvar endereço'); return; }
    toast.success('Endereço salvo!');
    queryClient.invalidateQueries({ queryKey: ['bazar-profile'] });
  };

  // Submit item
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !customerPrice) return toast.error('Preencha título e preço');
    if (imageFiles.length === 0) return toast.error('Adicione pelo menos 1 foto');
    setSubmitting(true);
    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/bazar_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const url = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        imageUrls.push(url);
      }

      const { error } = await supabase.from('bazar_items').insert([{
        owner_id: store.owner_id,
        seller_id: user.id,
        title,
        description,
        customer_price: parseFloat(customerPrice),
        condition,
        size: size || null,
        color: color || null,
        category: subcategory ? `Bazar VIP > ${subcategory}` : 'Bazar VIP',
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseInt(height) : null,
        width: width ? parseInt(width) : null,
        length: length ? parseInt(length) : null,
        images: imageUrls,
        status: 'pending'
      }]);
      if (error) throw error;

      toast.success('Peça enviada para curadoria!');
      setSubmitted(true);
      setTitle(''); setDescription(''); setCustomerPrice(''); setCondition('used');
      setSize(''); setColor(''); setCategory(''); setSubcategory('');
      setWeight(''); setHeight(''); setWidth(''); setLength('');
      setImageFiles([]);
      queryClient.invalidateQueries({ queryKey: ['my-bazar-items'] });
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Em Curadoria</span>;
      case 'approved': return <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Publicada</span>;
      case 'sold': return <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full"><ShoppingBag className="w-3 h-3" /> Vendida!</span>;
      case 'rejected': return <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> Rejeitada</span>;
      default: return null;
    }
  };

  // Page title
  useEffect(() => { document.title = store ? `Bazar VIP — ${store.store_name}` : 'Bazar VIP'; }, [store]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50"><div className="animate-spin h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full" /></div>;

  const primaryColor = store?.primary_color || '#9333ea';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {store?.logo_url && <img src={store.logo_url} className="h-10 w-10 rounded-full object-cover border-2 shadow-sm" style={{ borderColor: primaryColor }} />}
          <div>
            <h1 className="font-black text-lg text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: primaryColor }} /> Bazar VIP
            </h1>
            <p className="text-xs text-slate-500 font-medium">{store?.store_name || 'Carregando...'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* === STEP 1: AUTH === */}
        {!user && (
          <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: primaryColor + '20' }}>
                <LogIn className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-xl font-black text-slate-900">Acesse sua conta</h2>
              <p className="text-sm text-slate-500 mt-1">Para cadastrar suas peças no Bazar VIP de <strong>{store?.store_name}</strong></p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Seu Nome</label>
                  <Input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Como podemos te chamar?" className="h-12 bg-slate-50" required />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">E-mail</label>
                <Input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="seu@email.com" className="h-12 bg-slate-50" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Senha</label>
                <Input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="h-12 bg-slate-50" required />
              </div>
              <Button type="submit" disabled={authProcessing} className="w-full h-12 font-bold text-base rounded-xl shadow-lg" style={{ backgroundColor: primaryColor }}>
                {authProcessing ? 'Aguarde...' : authMode === 'signup' ? 'Criar Conta e Continuar' : 'Entrar'}
              </Button>
              <p className="text-center text-sm text-slate-500">
                {authMode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
                <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="font-bold hover:underline" style={{ color: primaryColor }}>
                  {authMode === 'login' ? 'Cadastre-se' : 'Fazer login'}
                </button>
              </p>
            </form>
          </div>
        )}

        {/* === STEP 2: ADDRESS === */}
        {user && !hasAddress && !profileLoading && (
          <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Seu Endereço</h2>
              <p className="text-sm text-slate-500 mt-1">Precisamos do seu endereço para calcular o frete das peças vendidas.</p>
            </div>
            <form onSubmit={saveAddress} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">CEP *</label>
                <div className="flex gap-2">
                  <Input 
                    value={addressForm.cep} 
                    onChange={e => setAddressForm({ ...addressForm, cep: e.target.value })}
                    placeholder="00000-000" 
                    className="h-12 bg-slate-50 flex-1"
                    maxLength={9}
                  />
                  <Button type="button" onClick={() => lookupCep(addressForm.cep)} disabled={cepLoading} variant="outline" className="h-12 px-6 font-bold">
                    {cepLoading ? '...' : 'Buscar'}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Rua *</label>
                  <Input value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} className="h-12 bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Nº *</label>
                  <Input value={addressForm.address_number} onChange={e => setAddressForm({ ...addressForm, address_number: e.target.value })} className="h-12 bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Bairro</label>
                <Input value={addressForm.neighborhood} onChange={e => setAddressForm({ ...addressForm, neighborhood: e.target.value })} className="h-12 bg-slate-50" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Cidade *</label>
                  <Input value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className="h-12 bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">UF *</label>
                  <Input value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} maxLength={2} className="h-12 bg-slate-50 uppercase" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 font-bold text-base rounded-xl shadow-lg" style={{ backgroundColor: primaryColor }}>
                Salvar Endereço e Continuar
              </Button>
            </form>
          </div>
        )}

        {/* === STEP 3: SUBMISSION FORM === */}
        {user && hasAddress && !submitted && (
          <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: primaryColor + '20' }}>
                <Camera className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-xl font-black text-slate-900">Cadastrar Peça</h2>
              <p className="text-sm text-slate-500 mt-1">Preencha os dados e envie para curadoria da loja.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Images */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Fotos da Peça * (até 5)</label>
                <div className="grid grid-cols-5 gap-2">
                  {imageFiles.map((f, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border-2 border-dashed relative group">
                      <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/50 text-white font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        Remover
                      </button>
                    </div>
                  ))}
                  {imageFiles.length < 5 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">Foto</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) setImageFiles(prev => [...prev, f]);
                      }} />
                    </label>
                  )}
                </div>
              </div>

              {/* Title + Description */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Título da Peça *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Blusa de Seda Zara" className="h-12 bg-slate-50" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Descrição</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva a peça (marca, material, detalhes...)" className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm min-h-[80px] resize-none focus:ring-1 focus:outline-none" style={{ '--tw-ring-color': primaryColor } as any} />
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Quanto você quer receber? (R$) *</label>
                <Input type="number" step="0.01" min="1" value={customerPrice} onChange={e => setCustomerPrice(e.target.value)} placeholder="0.00" className="h-12 bg-slate-50 text-lg font-bold" required />
                <p className="text-[11px] text-slate-400 mt-1">A loja pode adicionar uma comissão sobre esse valor para o preço final de venda.</p>
              </div>

              {/* Condition + Size + Color */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Estado</label>
                  <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full h-12 bg-slate-50 border rounded-xl px-3 text-sm font-medium">
                    <option value="new">Nova</option>
                    <option value="like_new">Seminova</option>
                    <option value="used">Usada</option>
                    <option value="worn">Com Desgaste</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Tamanho</label>
                  <Input value={size} onChange={e => setSize(e.target.value)} placeholder="Ex: M" className="h-12 bg-slate-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Cor</label>
                  <Input value={color} onChange={e => setColor(e.target.value)} placeholder="Ex: Preto" className="h-12 bg-slate-50" />
                </div>
              </div>

              {/* Subcategoria (Categoria fixa: Bazar VIP) */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">Subcategoria</label>
                {bazarSubcategories.length > 0 ? (
                  <select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="w-full h-12 bg-slate-50 border rounded-xl px-3 text-sm font-medium">
                    <option value="">Selecione a subcategoria...</option>
                    {bazarSubcategories.map((s: any) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-2">A loja ainda não cadastrou subcategorias para o Bazar VIP.</p>
                )}
              </div>

              {/* Dimensions */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block flex items-center gap-2"><Package className="w-4 h-4" /> Dimensões da Embalagem</label>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Peso (kg)</span>
                    <Input type="number" step="0.001" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0.5" className="h-10 bg-slate-50 text-sm" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Alt. (cm)</span>
                    <Input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="10" className="h-10 bg-slate-50 text-sm" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Larg. (cm)</span>
                    <Input type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder="20" className="h-10 bg-slate-50 text-sm" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Comp. (cm)</span>
                    <Input type="number" value={length} onChange={e => setLength(e.target.value)} placeholder="30" className="h-10 bg-slate-50 text-sm" />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-14 font-bold text-base rounded-xl shadow-xl transition-all hover:scale-[1.02]" style={{ backgroundColor: primaryColor }}>
                {submitting ? (
                  <span className="flex items-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> Enviando...</span>
                ) : (
                  <><ArrowRight className="w-5 h-5 mr-2" /> Enviar para Curadoria</>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* === STEP 4: SUCCESS === */}
        {submitted && (
          <div className="bg-white rounded-2xl shadow-lg border p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Peça Enviada!</h2>
            <p className="text-sm text-slate-500 mb-6">Sua peça entrará em curadoria pela equipe de <strong>{store?.store_name}</strong>. Você será notificado quando for aprovada e publicada no Bazar!</p>
            <Button onClick={() => setSubmitted(false)} className="h-12 px-8 font-bold rounded-xl" style={{ backgroundColor: primaryColor }}>
              Cadastrar Outra Peça
            </Button>
          </div>
        )}

        {/* === MY ITEMS === */}
        {user && hasAddress && myItems.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="p-5 border-b bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} /> Minhas Peças</h3>
            </div>
            <div className="divide-y">
              {myItems.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  {item.images?.[0] && <img src={item.images[0]} className="w-14 h-14 rounded-xl object-cover border" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500">R$ {Number(item.customer_price).toFixed(2)}</p>
                    {item.status === 'rejected' && item.rejection_reason && (
                      <p className="text-xs text-rose-500 mt-1 italic">Motivo: {item.rejection_reason}</p>
                    )}
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
