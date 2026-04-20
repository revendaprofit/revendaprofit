import { DollarSign, Calendar, Users, Shuffle } from "lucide-react"

interface Props {
  totalValue: number
  installmentCount: number
  installmentValue: number
  activeCount: number
  totalParticipants: number
  drawnCount: number
  totalDraws: number
}

export default function ConsortiumStatsCards({
  totalValue,
  installmentCount,
  installmentValue,
  activeCount,
  totalParticipants,
  drawnCount,
  totalDraws,
}: Props) {
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const stats = [
    {
      label: "Valor Total",
      value: fmt(totalValue),
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Parcelas",
      value: `${installmentCount}x ${fmt(installmentValue)}`,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Ativos",
      value: `${activeCount}/${totalParticipants}`,
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Sorteados",
      value: `${drawnCount}/${totalDraws}`,
      icon: Shuffle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-card border rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className={`w-11 h-11 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
            <p className="font-bold text-base leading-tight mt-0.5">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
