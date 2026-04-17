import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit2, Plus, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SubcategoriesDialog } from '@/components/stock/SubcategoriesDialog';

type Subcategory = { id: string; name: string };
type Category = { id: string; name: string; subcategories?: Subcategory[] };

export default function Categories() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*, subcategories(*)').order('name');
      if (error) throw error;
      return data as Category[];
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (category: Partial<Category>) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Não autenticado');
      
      const { id, ...rest } = category;
      const payload = { ...rest, owner_id: user.id };
      
      if (id) {
        const { error } = await supabase.from('categories').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria salva com sucesso!');
      setIsOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(`Erro ao salvar: ${e.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria removida!');
    }
  });

  const resetForm = () => {
    setEditingCategory(null);
    setName('');
  };

  const handleEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    upsertMutation.mutate({ id: editingCategory?.id, name });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Nova Categoria</Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6 rounded-xl">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Camisetas" />
              </div>
              <Button type="submit" className="w-full" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Nome</TableHead>
              <TableHead className="w-[150px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={2} className="text-center">Carregando...</TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Nenhuma categoria cadastrada.</TableCell></TableRow>
            ) : (
              categories.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium text-base mb-1">{c.name}</div>
                    {c.subcategories && c.subcategories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.subcategories.map(sub => (
                          <span key={sub.id} className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary/20">
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1.5 italic">Nenhuma subcategoria</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Subcategorias">
                            <Layers className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <SubcategoriesDialog category={c} />
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if(confirm('Tem certeza? Produtos vinculados perderão a categoria e subcategorias serão excluídas.')) deleteMutation.mutate(c.id);
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
