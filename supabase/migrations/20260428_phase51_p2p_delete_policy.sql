-- Adiciona política RLS para permitir que os membros de uma parceria possam excluí-la
DROP POLICY IF EXISTS "Usuarios deletam suas parcerias" ON public.partnerships;
CREATE POLICY "Usuarios deletam suas parcerias" ON public.partnerships 
FOR DELETE 
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
