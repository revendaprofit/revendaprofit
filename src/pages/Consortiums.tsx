import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import {
  Plus,
  PiggyBank,
  CheckCircle2,
  Users,
  Shuffle,
  Calendar,
  ChevronRight,
  MoreVertical,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import CreateConsortiumDialog from "@/components/consortiums/CreateConsortiumDialog"

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Ativo", color: "text-emerald-700 bg-emerald-50" },
  completed: { label: "Concluído", color: "text-blue-700 bg-blue-50" },
  cancelled: { label: "Cancelado", color: "text-slate-600 bg-slate-100" },
}

export default function Consortiums() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: consortiums = [], isLoading } = useQuery({
    queryKey: ["consortiums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consortiums")
        .select(`
          *,
          participants:consortium_participants(id, status),
          draws:consortium_draws(id)
        `)
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Tem certeza que deseja excluir este consórcio? Esta ação não pode ser desfeita.")) return
    const { error } = await supabase.from("consortiums").delete().eq("id", id)
    if (error) {
      toast.error("Erro ao excluir: " + error.message)
    } else {
      toast.success("Consórcio excluído!")
      queryClient.invalidateQueries({ queryKey: ["consortiums"] })
    }
  }

  // Stats globais
  const totalConsortiums = consortiums.length
  const activeCount = consortiums.filter((c: any) => c.status === "active").length
  const totalParticipants = consortiums.reduce(
    (acc: number, c: any) => acc + (c.participants?.length || 0),
    0
  )
  const totalDraws = consortiums.reduce(
    (acc: number, c: any) => acc + (c.draws?.length || 0),
    0
  )

  const globalStats = [
    { label: "Total Consórcios", value: totalConsortiums, icon: PiggyBank, color: "text-primary", bg: "bg-primary/10" },
    { label: "Ativos", value: activeCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Participantes", value: totalParticipants, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Sorteios", value: totalDraws, icon: Shuffle, color: "text-amber-600", bg: "bg-amber-50" },
  ]

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consórcios</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus grupos de consórcio.</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="shadow-md hover:-translate-y-0.5 transition-transform gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Consórcio
        </Button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {globalStats.map((s) => (
          <div key={s.label} className="bg-card border rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className="font-black text-2xl leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grupos de Consórcio */}
      <div>
        <h2 className="font-bold text-xl mb-4">Grupos de Consórcio</h2>

        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Carregando...</div>
        ) : consortiums.length === 0 ? (
          <div className="bg-muted/50 border-dashed rounded-xl border-2 flex flex-col items-center justify-center text-center p-14 min-h-[300px]">
            <div className="w-16 h-16 bg-background rounded-full shadow-sm flex items-center justify-center mb-4">
              <PiggyBank className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Nenhum consórcio criado</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Crie seu primeiro grupo de consórcio e comece a gerenciar participantes, sorteios e pagamentos.
            </p>
            <Button onClick={() => setCreateOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Consórcio
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span>Nome</span>
              <span>Período</span>
              <span>Status</span>
              <span>Participantes</span>
              <span className="w-8" />
            </div>

            <div className="divide-y">
              {consortiums.map((c: any) => {
                const sc = statusConfig[c.status] || statusConfig.active
                const participants = c.participants || []
                const fmt = (d: string) => format(new Date(d), "dd/MM/yyyy", { locale: ptBR })

                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/consortiums/${c.id}`)}
                    className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <div>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{c.name}</p>
                      {c.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {fmt(c.start_date)} até {fmt(c.end_date)}
                    </div>

                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${sc.color}`}>
                      {sc.label}
                    </span>

                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      {participants.length}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDelete(c.id, e)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <CreateConsortiumDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
