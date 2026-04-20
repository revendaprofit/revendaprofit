import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AlertTriangle, Percent, Truck, AlertCircle, Save, ChevronDown } from "lucide-react"

interface Props {
  consortium: any
}

interface FormData {
  grace_days: number
  penalty_cash_pct: number
  penalty_exchange_pct: number
  shipping_policy: string
  quota_extinction_rule: string
}

const SHIPPING_OPTIONS = [
  { value: "first_free", label: "Primeiro frete grátis pela loja" },
  { value: "all_paid", label: "Todos os fretes pagos pelo cliente" },
  { value: "all_free", label: "Todos os fretes grátis" },
]

const EXTINCTION_OPTIONS = [
  { value: "redistribute", label: "Redistribuir parcelas entre os outros participantes" },
  { value: "cancel", label: "Cancelar a cota e reduzir o total do grupo" },
  { value: "suspend", label: "Suspender a cota (aguardar decisão manual)" },
]

export default function ConsortiumSettingsTab({ consortium }: Props) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [shippingOpen, setShippingOpen] = useState(false)
  const [extinctionOpen, setExtinctionOpen] = useState(false)

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      grace_days: consortium.grace_days ?? 5,
      penalty_cash_pct: consortium.penalty_cash_pct ?? 10,
      penalty_exchange_pct: consortium.penalty_exchange_pct ?? 5,
      shipping_policy: consortium.shipping_policy ?? "first_free",
      quota_extinction_rule: consortium.quota_extinction_rule ?? "redistribute",
    },
  })

  const shippingValue = watch("shipping_policy")
  const extinctionValue = watch("quota_extinction_rule")

  const onSubmit = async (data: FormData) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("consortiums")
        .update({
          grace_days: Number(data.grace_days),
          penalty_cash_pct: Number(data.penalty_cash_pct),
          penalty_exchange_pct: Number(data.penalty_exchange_pct),
          shipping_policy: data.shipping_policy,
          quota_extinction_rule: data.quota_extinction_rule,
        })
        .eq("id", consortium.id)

      if (error) throw error
      toast.success("Configurações salvas!")
      queryClient.invalidateQueries({ queryKey: ["consortium", consortium.id] })
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const currentShipping = SHIPPING_OPTIONS.find((o) => o.value === shippingValue)
  const currentExtinction = EXTINCTION_OPTIONS.find((o) => o.value === extinctionValue)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">

      {/* Carência e Inadimplência */}
      <section className="bg-card border rounded-xl p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-base">Carência e Inadimplência</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure as regras para pagamentos em atraso.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Dias de Carência</label>
          <Input
            type="number"
            min="0"
            max="60"
            className="max-w-[120px]"
            {...register("grace_days")}
          />
          <p className="text-xs text-muted-foreground">
            Dias após o vencimento antes de bloquear participação no sorteio.
          </p>
        </div>
      </section>

      {/* Multas por Desistência */}
      <section className="bg-card border rounded-xl p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Percent className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-base">Multas por Desistência</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Defina os percentuais de multa ao encerrar cotas.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Multa (Devolução em Dinheiro)</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="max-w-[100px]"
                {...register("penalty_cash_pct")}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Sobre o valor já pago</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Multa (Troca por Roupa)</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="max-w-[100px]"
                {...register("penalty_exchange_pct")}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Multiplica incentivo troca por produto</p>
          </div>
        </div>
      </section>

      {/* Política de Frete */}
      <section className="bg-card border rounded-xl p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Truck className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-base">Política de Frete</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Como o frete será cobrado nas entregas.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShippingOpen(!shippingOpen)}
            className="w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm hover:bg-secondary transition-colors text-left"
          >
            <span>{currentShipping?.label || "Selecione..."}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${shippingOpen ? "rotate-180" : ""}`} />
          </button>
          {shippingOpen && (
            <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg overflow-hidden">
              {SHIPPING_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => { setValue("shipping_policy", opt.value); setShippingOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-secondary transition-colors ${
                    shippingValue === opt.value ? "bg-primary/10 text-primary font-medium" : ""
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Regra de Extinção de Cota */}
      <section className="bg-card border rounded-xl p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <h3 className="font-semibold text-base">Regra de Extinção de Cota</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            O que acontece quando um participante desiste.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setExtinctionOpen(!extinctionOpen)}
            className="w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm hover:bg-secondary transition-colors text-left"
          >
            <span>{currentExtinction?.label || "Selecione..."}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${extinctionOpen ? "rotate-180" : ""}`} />
          </button>
          {extinctionOpen && (
            <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg overflow-hidden">
              {EXTINCTION_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => { setValue("quota_extinction_rule", opt.value); setExtinctionOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-secondary transition-colors ${
                    extinctionValue === opt.value ? "bg-primary/10 text-primary font-medium" : ""
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Você poderá ajustar manualmente as parcelas após uma desistência.
        </p>
      </section>

      <Button type="submit" disabled={isSaving} className="gap-2 shadow-md">
        <Save className="w-4 h-4" />
        {isSaving ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </form>
  )
}
