import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Bem-vindo(a) ao Revenda Profit, {user?.email}!</p>
          </div>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            Sair
          </Button>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Métricas placeholder */}
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <h3 className="tracking-tight text-sm font-medium">Vendas no Mês</h3>
            <div className="text-2xl font-bold mt-2">R$ 0,00</div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <h3 className="tracking-tight text-sm font-medium">Estoque</h3>
            <div className="text-2xl font-bold mt-2">0 produtos</div>
          </div>
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <h3 className="tracking-tight text-sm font-medium">Clientes</h3>
            <div className="text-2xl font-bold mt-2">0 cadastros</div>
          </div>
        </div>
      </div>
    </div>
  );
}
