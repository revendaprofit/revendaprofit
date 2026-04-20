import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import AddParticipantDialog from "./AddParticipantDialog"
import {
  UserPlus,
  Shuffle,
  CheckCircle2,
  AlertTriangle,
  UserX,
  ChevronDown,
  ChevronUp,
  BadgeDollarSign,
} from "lucide-react"

interface Props {
  consortium: any
  participants: any[]
  onDrawRequest: () => void
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "Ativo", color: "text-emerald-700 bg-emerald-50", icon: CheckCircle2 },
  drawn: { label: "Contemplado", color: "text-blue-700 bg-blue-50", icon: Shuffle },
  withdrawn: { label: "Desistiu", color: "text-slate-600 bg-slate-100", icon: UserX },
  defaulting: { label: "Inadimplente", color: "text-destructive bg-destructive/10", icon: AlertTriangle },
}

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  up_to_date: { label: "Em dia", color: "text-emerald-700 bg-emerald-50" },
  overdue: { label: "Atrasado", color: "text-destructive bg-destructive/10" },
  paid_off: { label: "Quitado", color: "text-blue-700 bg-blue-50" },
}

export default function ConsortiumParticipantsTab({ consortium, participants, onDrawRequest }: Props) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [addOpen, setAddOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [markingPayment, setMarkingPayment] = useState<string | null>(null)

  const eligibleForDraw = participants.filter(
    (p) => p.status === "active" && p.payment_status === "up_to_date"
  )

  const handleMarkInstallmentPaid = async (participant: any) => {
    if (markingPayment) return
    setMarkingPayment(participant.id)
    try {
      const nextInstallment = participant.installments_paid + 1
      const totalInstallments = consortium.installment_count

      // 1) Registrar pagamento
      const { error: payError } = await supabase.from("consortium_installment_payments").insert({
        participant_id: participant.id,
        consortium_id: consortium.id,
        installment_number: nextInstallment,
        amount: consortium.installment_value,
        paid_at: new Date().toISOString(),
        payment_method: "manual",
        status: "paid",
      })
      if (payError) throw payError

      // 2) Atualizar participante
      const isPaidOff = nextInstallment >= totalInstallments
      await supabase
        .from("consortium_participants")
        .update({
          installments_paid: nextInstallment,
          payment_status: isPaidOff ? "paid_off" : "up_to_date",
        })
        .eq("id", participant.id)

      // 3) Registrar como Venda no histórico (sem produtos)
      if (user) {
        const pmLabel: Record<string, string> = {
          cash: "Dinheiro", pix: "PIX", card: "Cartão", transfer: "Transferência",
        }
        await supabase.from("sales").insert({
          owner_id: user.id,
          customer_id: participant.customer_id || null,
          total_amount: consortium.installment_value,
          discount: 0,
          payment_method: pmLabel[participant.payment_method] || participant.payment_method || "Consórcio",
          status: "completed",
          sale_origin: "Parcela Consórcio",
          consortium_participant_id: participant.id,
        })
      }

      toast.success(`Parcela ${nextInstallment}/${totalInstallments} registrada!`)
      queryClient.invalidateQueries({ queryKey: ["consortium", consortium.id] })
    } catch (err: any) {
      toast.error("Erro ao registrar parcela: " + err.message)
    } finally {
      setMarkingPayment(null)
    }
  }

  const handleChangeStatus = async (participantId: string, newStatus: string) => {
    try {
      await supabase
        .from("consortium_participants")
        .update({ status: newStatus })
        .eq("id", participantId)
      toast.success("Status atualizado!")
      queryClient.invalidateQueries({ queryKey: ["consortium", consortium.id] })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-base text-foreground">
          Participantes ({participants.length})
          {eligibleForDraw.length > 0 && (
            <span className="ml-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {eligibleForDraw.length} elegíveis
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDrawRequest}
            disabled={eligibleForDraw.length === 0}
            className="gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Sortear
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Table */}
      {participants.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-3">
            <UserPlus className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground mb-1">Nenhum participante adicionado</p>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione os participantes do seu consórcio para controlar os pagamentos
          </p>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Participante
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_auto] gap-3 px-4 py-2.5 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Nome</span>
            <span>Telefone</span>
            <span>Pagamento</span>
            <span>Parcelas</span>
            <span>Status</span>
            <span className="w-8" />
          </div>

          {/* Rows */}
          <div className="divide-y">
            {participants.map((p) => {
              const sc = statusConfig[p.status] || statusConfig.active
              const pc = paymentStatusConfig[p.payment_status] || paymentStatusConfig.up_to_date
              const StatusIcon = sc.icon
              const isExpanded = expandedId === p.id
              const progress = (p.installments_paid / consortium.installment_count) * 100

              return (
                <div key={p.id}>
                  <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_auto] gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                    {/* Nome */}
                    <div>
                      <p className="font-medium text-sm leading-tight">
                        {p.customer_name || p.customer?.name || "—"}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>

                    {/* Telefone */}
                    <p className="text-sm text-muted-foreground">
                      {p.phone || p.customer?.phone || "—"}
                    </p>

                    {/* Forma de Pagamento */}
                    <div className="text-sm">
                      <span className="font-medium">
                        {{
                          cash: "Dinheiro",
                          pix: "PIX",
                          card: "Cartão",
                          transfer: "Transferência",
                        }[p.payment_method as string] || p.payment_method}
                      </span>
                      {p.due_day && (
                        <p className="text-xs text-muted-foreground">Vence dia {p.due_day}</p>
                      )}
                    </div>

                    {/* Parcelas + barra de progresso */}
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {p.installments_paid}
                        <span className="text-muted-foreground font-normal">/{consortium.installment_count}</span>
                      </p>
                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Payment Status */}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${pc.color}`}>
                      {pc.label}
                    </span>

                    {/* Expandir */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Ações expandidas */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 bg-muted/20 space-y-3">
                      {/* Crédito de contemplação (só para contemplados) */}
                      {p.status === "drawn" && (p.credit_awarded || 0) > 0 && (
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <div className="text-2xl">💎</div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Crédito de Contemplação</p>
                            <div className="flex gap-4 text-sm">
                              <span className="text-muted-foreground">
                                Concedido: <strong>{fmt(p.credit_awarded || 0)}</strong>
                              </span>
                              <span className="text-muted-foreground">
                                Utilizado: <strong className="text-destructive">{fmt(p.credit_used || 0)}</strong>
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-amber-700 font-semibold">Restante</p>
                            <p className="text-lg font-black text-amber-800">
                              {fmt(Math.max(0, (p.credit_awarded || 0) - (p.credit_used || 0)))}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Botões de ação */}
                      <div className="flex flex-wrap gap-2">
                      {(p.status === "active" || p.status === "drawn") && p.payment_status !== "paid_off" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          disabled={markingPayment === p.id}
                          onClick={() => handleMarkInstallmentPaid(p)}
                        >
                          <BadgeDollarSign className="w-3.5 h-3.5" />
                          {markingPayment === p.id
                            ? "Registrando..."
                            : `Dar Baixa (Parc. ${p.installments_paid + 1})`}
                        </Button>
                      )}

                      {(p.status === "active" || p.status === "drawn") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-destructive border-destructive/30"
                          onClick={() => handleChangeStatus(p.id, "withdrawn")}
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Registrar Desistência
                        </Button>
                      )}

                      {p.status === "withdrawn" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(p.id, "active")}
                        >
                          Reativar
                        </Button>
                      )}

                      <div className="text-xs text-muted-foreground flex items-center ml-auto">
                        Valor pago:{" "}
                        <strong className="ml-1">
                          {fmt(p.installments_paid * consortium.installment_value)}
                        </strong>
                        {" "}/ {fmt(consortium.total_value)}
                      </div>
                      </div>{/* end botões */}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <AddParticipantDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        consortiumId={consortium.id}
      />
    </div>
  )
}
