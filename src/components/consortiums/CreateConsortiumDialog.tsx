import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CalendarDays, DollarSign, Hash, FileText } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormData {
  name: string
  start_date: string
  end_date: string
  total_value: string
  installment_value: string
  installment_count: string
  description: string
}

export default function CreateConsortiumDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      installment_count: "12",
    }
  })

  // Auto-calcular parcelas quando total e valor de parcela mudam
  const totalValue = useWatch({ control, name: "total_value" })
  const installmentValue = useWatch({ control, name: "installment_value" })

  const handleTotalOrInstallmentChange = (field: "total_value" | "installment_value", value: string) => {
    const total = field === "total_value" ? parseFloat(value) : parseFloat(totalValue || "0")
    const installment = field === "installment_value" ? parseFloat(value) : parseFloat(installmentValue || "0")

    if (total > 0 && installment > 0) {
      const count = Math.round(total / installment)
      setValue("installment_count", String(count))
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    setIsLoading(true)
    try {
      const { error } = await supabase.from("consortiums").insert({
        owner_id: user.id,
        name: data.name,
        description: data.description || null,
        start_date: data.start_date,
        end_date: data.end_date,
        total_value: parseFloat(data.total_value),
        installment_value: parseFloat(data.installment_value),
        installment_count: parseInt(data.installment_count),
        status: "active",
      })

      if (error) throw error

      toast.success("Consórcio criado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["consortiums"] })
      reset()
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Erro ao criar consórcio: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Criar Novo Consórcio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nome do Grupo</label>
            <Input
              placeholder="Ex: Consórcio Janeiro 2025"
              className={errors.name ? "border-destructive" : ""}
              {...register("name", { required: true })}
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                Data Início
              </label>
              <Input
                type="date"
                className={errors.start_date ? "border-destructive" : ""}
                {...register("start_date", { required: true })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                Data Fim
              </label>
              <Input
                type="date"
                className={errors.end_date ? "border-destructive" : ""}
                {...register("end_date", { required: true })}
              />
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                Valor Total (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className={errors.total_value ? "border-destructive" : ""}
                {...register("total_value", {
                  required: true,
                  onChange: (e) => handleTotalOrInstallmentChange("total_value", e.target.value),
                })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                Valor Parcela (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className={errors.installment_value ? "border-destructive" : ""}
                {...register("installment_value", {
                  required: true,
                  onChange: (e) => handleTotalOrInstallmentChange("installment_value", e.target.value),
                })}
              />
            </div>
          </div>

          {/* Qtd parcelas (calculado automaticamente, mas editável) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-muted-foreground" />
              Quantidade de Parcelas
            </label>
            <Input
              type="number"
              min="1"
              placeholder="12"
              {...register("installment_count", { required: true, min: 1 })}
            />
            <p className="text-xs text-muted-foreground">Calculado automaticamente com base nos valores acima</p>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Descrição (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Detalhes sobre o consórcio..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              {...register("description")}
            />
          </div>

          <Button type="submit" className="w-full h-11 font-bold" disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar Consórcio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
