import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Users, Shuffle, Settings } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import ConsortiumStatsCards from "@/components/consortiums/ConsortiumStatsCards"
import ConsortiumParticipantsTab from "@/components/consortiums/ConsortiumParticipantsTab"
import ConsortiumDrawsTab from "@/components/consortiums/ConsortiumDrawsTab"
import ConsortiumSettingsTab from "@/components/consortiums/ConsortiumSettingsTab"

export default function ConsortiumDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("participants")

  const { data, isLoading } = useQuery({
    queryKey: ["consortium", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consortiums")
        .select(`
          *,
          participants:consortium_participants(
            *,
            customer:customers(name, phone)
          ),
          draws:consortium_draws(
            *,
            participant:consortium_participants(
              customer:customers(name, phone)
            )
          )
        `)
        .eq("id", id)
        .eq("owner_id", user?.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id && !!user,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Consórcio não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/consortiums")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  const consortium = data
  const participants = consortium.participants || []
  const draws = consortium.draws || []

  const activeParticipants = participants.filter((p: any) => p.status === "active")
  const drawnParticipants = participants.filter((p: any) => p.status === "drawn")

  const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: "Ativo", color: "text-emerald-700 bg-emerald-50 border border-emerald-200" },
    completed: { label: "Concluído", color: "text-blue-700 bg-blue-50 border border-blue-200" },
    cancelled: { label: "Cancelado", color: "text-slate-600 bg-slate-100 border border-slate-200" },
  }
  const sc = statusConfig[consortium.status] || statusConfig.active

  return (
    <div className="space-y-6 pb-20">
      {/* Back button + Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/consortiums")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{consortium.name}</h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.color}`}>
              {sc.label}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {format(new Date(consortium.start_date), "dd/MM/yyyy", { locale: ptBR })} até{" "}
            {format(new Date(consortium.end_date), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <ConsortiumStatsCards
        totalValue={consortium.total_value}
        installmentCount={consortium.installment_count}
        installmentValue={consortium.installment_value}
        activeCount={activeParticipants.length}
        totalParticipants={participants.length}
        drawnCount={drawnParticipants.length}
        totalDraws={consortium.installment_count}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="participants" className="gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Participantes
          </TabsTrigger>
          <TabsTrigger value="draws" className="gap-1.5">
            <Shuffle className="w-3.5 h-3.5" />
            Sorteios
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="mt-6">
          <ConsortiumParticipantsTab
            consortium={consortium}
            participants={participants}
            onDrawRequest={() => setActiveTab("draws")}
          />
        </TabsContent>

        <TabsContent value="draws" className="mt-6">
          <ConsortiumDrawsTab
            consortium={consortium}
            participants={participants}
            draws={draws}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <ConsortiumSettingsTab consortium={consortium} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
