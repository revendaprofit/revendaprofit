import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit2, Plus, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Category = { id: string; name: string };
type Subcategory = { id: string; category_id: string; name: string };

interface SubcategoriesDialogProps {
  category: Category;
}

export function SubcategoriesDialog({ category }: SubcategoriesDialogProps) {
  const queryClient = useQueryClient();
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [name, setName] = useState('');

  const { data: subcategories = [], isLoading } = useQuery({
    queryKey: ['subcategories', category.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', category.id)
        .order('name');
      if (error) throw error;
      return data as Subcategory[];
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (sub: Partial<Subcategory>) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Não autenticado');
      
      const { id, ...rest } = sub;
      const payload = { ...rest, category_id: category.id, owner_id: user.id };
      
      if (id) {
        const { error } = await supabase.from('subcategories').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('subcategories').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories', category.id] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Subcategoria salva com sucesso!');
      resetForm();
    },
    onError: (e) => toast.error(`Erro ao salvar: ${e.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subcategories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories', category.id] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Subcategoria removida!');
    }
  });

  const resetForm = () => {
    setEditingSub(null);
    setName('');
  };

  const handleEdit = (s: Subcategory) => {
    setEditingSub(s);
    setName(s.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    upsertMutation.mutate({ id: editingSub?.id, name });
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Subcategorias de {category.name}</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="flex gap-2 items-end mb-4">
        <div className="flex-1">
          <label className="text-sm font-medium">Nova Subcategoria</label>
          <Input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Ex: Vestidos, Blusas..." 
          />
        </div>
        <Button type="submit" disabled={upsertMutation.isPending}>
          {editingSub ? 'Atualizar' : 'Adicionar'}
        </Button>
        {editingSub && (
          <Button type="button" variant="outline" onClick={resetForm}>
            Cancelar
          </Button>
        )}
      </form>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={2} className="text-center">Carregando...</TableCell></TableRow>
            ) : subcategories.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4">Nenhuma subcategoria cadastrada.</TableCell></TableRow>
            ) : (
              subcategories.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if(confirm('Tem certeza? Produtos vinculados perderão a subcategoria.')) deleteMutation.mutate(s.id);
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
    </DialogContent>
  );
}
