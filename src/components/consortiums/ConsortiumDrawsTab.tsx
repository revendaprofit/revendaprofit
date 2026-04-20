import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Trophy, Calendar, User, StickyNote, Zap, MousePointer } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import ConsortiumRaffleScreen from "./ConsortiumRaffleScreen"

interface Props {
  consortium: any
  participants: any[]
  draws: any[]
}

export default function ConsortiumDrawsTab({ consortium, participants, draws }: Props) {
  const queryClient = useQueryClient()
  const [raffleOpen, setRaffleOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const eligible = participants.filter(
    (p) => p.status === "active" && p.payment_status === "up_to_date"
  )

  const registerManualDraw = async () => {
    if (!selectedWinner) return
    setIsSaving(true)
    try {
      const drawNumber = draws.length + 1
      const { error } = await supabase.from("consortium_draws").insert({
        consortium_id: consortium.id,
        participant_id: selectedWinner,
        draw_number: drawNumber,
        draw_type: "manual",
        draw_date: new Date().toISOString(),
        notes: notes || null,
      })
      if (error) throw error

      await supabase
        .from("consortium_participants")
        .update({
          status: "drawn",
          credit_awarded: consortium.total_value,
          credit_used: 0,
        })
        .eq("id", selectedWinner)

      toast.success("Sorteio manual registrado!")
      queryClient.invalidateQueries({ queryKey: ["consortium", consortium.id] })
      setManualOpen(false)
      setSelectedWinner(null)
      setNotes("")
    } catch (err: any) {
      toast.error("Erro: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Botões de ação */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* SORTEIO AO VIVO */}
        <button
          onClick={() => setRaffleOpen(true)}
          disabled={eligible.length === 0}
          className="relative overflow-hidden group flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
          style={{
            background: eligible.length > 0
              ? "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)"
              : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
            boxShadow: eligible.length > 0 ? "0 4px 24px rgba(168,85,247,0.4)" : "none",
          }}
        >
          <Zap className="w-4 h-4" />
          Sorteio Ao Vivo 🎉
          {eligible.length > 0 && (
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(135deg, #c084fc 0%, #f472b6 100%)" }}
            />
          )}
        </button>

        {/* MANUAL */}
        <Button
          variant="outline"
          onClick={() => setManualOpen(true)}
          disabled={eligible.length === 0}
          className="gap-2"
        >
          <MousePointer className="w-4 h-4" />
          Selecionar Manualmente
        </Button>

        {eligible.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum participante elegível no momento
          </p>
        )}
      </div>

      {/* Histórico */}
      <div>
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
          Histórico de Sorteios ({draws.length})
        </h3>

        {draws.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-3">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <p className="font-semibold text-foreground mb-1">Nenhum sorteio realizado</p>
            <p className="text-sm text-muted-foreground">
              Os sorteios aparecerão aqui conforme forem realizados
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {draws.map((draw: any) => (
              <div key={draw.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center shrink-0 font-black text-amber-600 text-lg">
                  #{draw.draw_number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="font-semibold text-sm">
                      {draw.participant?.customer_name
                        || draw.participant?.customer?.name
                        || "—"}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      draw.draw_type === "random"
                        ? "bg-primary/10 text-primary"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {draw.draw_type === "random" ? "🎲 Ao Vivo" : "✋ Manual"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(draw.draw_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {draw.notes && (
                      <span className="flex items-center gap-1">
                        <StickyNote className="w-3 h-3" />
                        {draw.notes}
                      </span>
                    )}
                  </div>
                </div>
                <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tela de Sorteio Ao Vivo (full-screen) */}
      <ConsortiumRaffleScreen
        open={raffleOpen}
        onClose={() => setRaffleOpen(false)}
        consortium={consortium}
        eligible={eligible}
        draws={draws}
      />

      {/* Dialog Sorteio Manual */}
      <Dialog open={manualOpen} onOpenChange={(o) => !o && setManualOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MousePointer className="w-5 h-5" />
              Selecionar Contemplado Manualmente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione o participante que será contemplado neste sorteio.
            </p>

            <div className="max-h-56 overflow-y-auto rounded-lg border divide-y">
              {eligible.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedWinner(p.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-secondary transition-colors ${
                    selectedWinner === p.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <p className="font-medium text-sm">
                    {p.customer_name || p.customer?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.installments_paid}/{consortium.installment_count} parcelas pagas
                  </p>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Observações (opcional)</label>
              <Input
                placeholder="Ex: Sorteio presencial confirmado"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setManualOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedWinner || isSaving}
                onClick={registerManualDraw}
              >
                {isSaving ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
