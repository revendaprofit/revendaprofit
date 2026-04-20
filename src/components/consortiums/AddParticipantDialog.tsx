import { useState } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"
import { UserPlus, ChevronDown } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  consortiumId: string
}

interface FormData {
  customer_name: string
  phone: string
  payment_method: string
  due_day: number
  notes: string
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "card", label: "Cartão" },
  { value: "transfer", label: "Transferência" },
]

export default function AddParticipantDialog({ open, onOpenChange, consortiumId }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      customer_name: "",
      phone: "",
      payment_method: "cash",
      due_day: 10,
      notes: "",
    },
  })

  const paymentMethod = watch("payment_method")

  // Busca clientes para o dropdown de nome
  const { data: customers = [] } = useQuery({
    queryKey: ["customers_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone")
        .eq("owner_id", user?.id)
        .order("name")
      if (error) throw error
      return data
    },
    enabled: !!user && open,
  })

  // Quando selecionar cliente do dropdown, preenche nome e telefone
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomerId(customer.id)
    setValue("customer_name", customer.name)
    setValue("phone", customer.phone || "")
  }

  const onSubmit = async (data: FormData) => {
    if (!data.customer_name.trim()) {
      toast.error("Informe o nome do participante")
      return
    }
    setIsLoading(true)
    try {
      const { error } = await supabase.from("consortium_participants").insert({
        consortium_id: consortiumId,
        customer_id: selectedCustomerId || null,
        customer_name: data.customer_name.trim(),
        phone: data.phone.trim() || null,
        payment_method: data.payment_method,
        due_day: Number(data.due_day),
        notes: data.notes.trim() || null,
        status: "active",
        payment_status: "up_to_date",
        installments_paid: 0,
      })
      if (error) throw error
      toast.success("Participante adicionado!")
      queryClient.invalidateQueries({ queryKey: ["consortium", consortiumId] })
      reset()
      setSelectedCustomerId(null)
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Erro ao adicionar participante: " + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = (o: boolean) => {
    if (!o) {
      reset()
      setSelectedCustomerId(null)
      setPaymentOpen(false)
    }
    onOpenChange(o)
  }

  const customerNameValue = watch("customer_name")
  const [nameOpen, setNameOpen] = useState(false)
  const filteredCustomers = customers.filter((c: any) =>
    !customerNameValue || c.name.toLowerCase().includes(customerNameValue.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Adicionar Participante
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome do Cliente (autocomplete) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome do Cliente</label>
            <div className="relative">
              <div className="flex items-center border rounded-md overflow-visible ring-0 focus-within:ring-2 focus-within:ring-ring">
                <input
                  autoComplete="off"
                  placeholder="Nome completo"
                  className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                  {...register("customer_name", { required: true })}
                  onFocus={() => setNameOpen(true)}
                  onBlur={() => setTimeout(() => setNameOpen(false), 180)}
                />
                <ChevronDown className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              </div>

              {nameOpen && filteredCustomers.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCustomers.map((c: any) => (
                    <button
                      type="button"
                      key={c.id}
                      onMouseDown={() => handleCustomerSelect(c)}
                      className="w-full text-left px-4 py-2.5 hover:bg-secondary transition-colors text-sm"
                    >
                      <p className="font-medium">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.customer_name && (
              <p className="text-xs text-destructive">Nome é obrigatório</p>
            )}
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Telefone</label>
            <Input
              placeholder="(00) 00000-0000"
              {...register("phone")}
            />
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Forma de Pagamento</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setPaymentOpen(!paymentOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm hover:bg-secondary transition-colors text-left"
              >
                <span>
                  {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label || "Selecione"}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${paymentOpen ? "rotate-180" : ""}`} />
              </button>
              {paymentOpen && (
                <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg overflow-hidden">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      type="button"
                      key={m.value}
                      onClick={() => {
                        setValue("payment_method", m.value)
                        setPaymentOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors ${
                        paymentMethod === m.value ? "bg-primary/10 text-primary font-medium" : ""
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dia de Vencimento */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Dia de Vencimento (1-31)</label>
            <Input
              type="number"
              min="1"
              max="31"
              className="max-w-[100px]"
              {...register("due_day", { required: true, min: 1, max: 31, valueAsNumber: true })}
            />
            {errors.due_day && (
              <p className="text-xs text-destructive">Informe um dia entre 1 e 31</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Observações</label>
            <textarea
              rows={3}
              placeholder="Observações..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              {...register("notes")}
            />
          </div>

          <Button type="submit" className="w-full h-10 font-bold" disabled={isLoading}>
            {isLoading ? "Adicionando..." : "Adicionar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
