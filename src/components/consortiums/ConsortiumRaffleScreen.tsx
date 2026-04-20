import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Trophy, Zap, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  onClose: () => void
  consortium: any
  eligible: any[]
  draws: any[]
}

type Phase =
  | "idle"       // tela inicial, botão "Iniciar Sorteio"
  | "countdown"  // 3 → 2 → 1
  | "rolling"    // nomes rolando rápido
  | "slowing"    // desacelerando
  | "winner"     // vencedor revelado

// ---------- util: gerar confetes ----------
function makeConfetti(count = 120) {
  const colors = ["#ff4f8b", "#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"]
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.4,
    dur: 1.8 + Math.random() * 1.6,
    size: 6 + Math.random() * 10,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotate: Math.random() * 360,
    shape: Math.random() > 0.5 ? "square" : "circle",
  }))
}

export default function ConsortiumRaffleScreen({
  open,
  onClose,
  consortium,
  eligible,
  draws,
}: Props) {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>("idle")
  const [countdown, setCountdown] = useState(3)
  const [displayed, setDisplayed] = useState<string>("")
  const [winner, setWinner] = useState<any>(null)
  const [confetti, setConfetti] = useState<ReturnType<typeof makeConfetti>>([])
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset quando abre/fecha
  useEffect(() => {
    if (!open) {
      clearAll()
      setPhase("idle")
      setCountdown(3)
      setDisplayed("")
      setWinner(null)
      setConfetti([])
      setNotes("")
    }
  }, [open])

  const clearAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  const getRandomName = useCallback(
    () => eligible[Math.floor(Math.random() * eligible.length)]?.customer_name
      || eligible[Math.floor(Math.random() * eligible.length)]?.customer?.name
      || "Participante",
    [eligible]
  )

  const startSequence = useCallback(() => {
    if (eligible.length === 0) return
    const picked = eligible[Math.floor(Math.random() * eligible.length)]

    // --- Fase 1: countdown 3→2→1 ---
    setPhase("countdown")
    setCountdown(3)

    let count = 3
    const cdInterval = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(cdInterval)
        startRolling(picked)
      } else {
        setCountdown(count)
      }
    }, 900)
  }, [eligible])

  const startRolling = (picked: any) => {
    setPhase("rolling")
    let speed = 60 // ms entre cada troca

    // Rola por 3s rápido
    intervalRef.current = setInterval(() => {
      setDisplayed(
        eligible[Math.floor(Math.random() * eligible.length)]?.customer_name
        || eligible[Math.floor(Math.random() * eligible.length)]?.customer?.name
        || "Participante"
      )
    }, speed)

    // Depois de 3s começa a desacelerar
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!)
      setPhase("slowing")
      slowDown(picked, 120)
    }, 3000)
  }

  const slowDown = (picked: any, delay: number) => {
    if (delay > 600) {
      // Chegou ao fim — revela o vencedor
      setWinner(picked)
      const name = picked.customer_name || picked.customer?.name || "Vencedor"
      setDisplayed(name)
      setPhase("winner")
      setConfetti(makeConfetti(140))
      return
    }
    timeoutRef.current = setTimeout(() => {
      setDisplayed(
        eligible[Math.floor(Math.random() * eligible.length)]?.customer_name
        || eligible[Math.floor(Math.random() * eligible.length)]?.customer?.name
        || "Participante"
      )
      slowDown(picked, delay + 55)
    }, delay)
  }

  const confirmWinner = async () => {
    if (!winner) return
    setSaving(true)
    try {
      const drawNumber = draws.length + 1
      const { error: drawError } = await supabase.from("consortium_draws").insert({
        consortium_id: consortium.id,
        participant_id: winner.id,
        draw_number: drawNumber,
        draw_type: "random",
        draw_date: new Date().toISOString(),
        notes: notes || null,
      })
      if (drawError) throw drawError

      await supabase
        .from("consortium_participants")
        .update({
          status: "drawn",
          credit_awarded: consortium.total_value, // crédito = valor total do consórcio
          credit_used: 0,
        })
        .eq("id", winner.id)

      toast.success("🎉 Sorteio registrado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["consortium", consortium.id] })
      onClose()
    } catch (err: any) {
      toast.error("Erro: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const winnerName = winner?.customer_name || winner?.customer?.name || ""

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at center, #1a0533 0%, #0a0015 70%)",
      }}
    >
      {/* Confetti */}
      {phase === "winner" &&
        confetti.map((c) => (
          <div
            key={c.id}
            className="absolute top-0 pointer-events-none"
            style={{
              left: `${c.x}%`,
              width: c.size,
              height: c.size,
              backgroundColor: c.color,
              borderRadius: c.shape === "circle" ? "50%" : "2px",
              transform: `rotate(${c.rotate}deg)`,
              animation: `confettiFall ${c.dur}s ${c.delay}s ease-in forwards`,
              opacity: 0,
            }}
          />
        ))}

      {/* CSS keyframes inline */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.2; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 40px 10px rgba(236,72,153,0.4); }
          50%       { box-shadow: 0 0 80px 30px rgba(168,85,247,0.7); }
        }
        @keyframes nameFlash {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes winnerPop {
          0%   { transform: scale(0.5) rotate(-6deg); opacity: 0; }
          60%  { transform: scale(1.12) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes countdownPop {
          0%   { transform: scale(2.5); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes trophyspin {
          0%   { transform: rotate(-15deg) scale(0.8); }
          50%  { transform: rotate(10deg) scale(1.1); }
          100% { transform: rotate(-15deg) scale(0.8); }
        }
        @keyframes starsBlink {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }
      `}</style>

      {/* Close button */}
      {(phase === "idle" || phase === "winner") && (
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* ===== IDLE ===== */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-8 text-center px-6">
          {/* Stars decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: 2 + Math.random() * 3,
                  height: 2 + Math.random() * 3,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `starsBlink ${1.5 + Math.random() * 2}s ${Math.random() * 2}s infinite`,
                }}
              />
            ))}
          </div>

          <div className="relative">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
            >
              <Trophy className="w-16 h-16 text-white drop-shadow-lg" />
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              Hora do Sorteio!
            </h1>
            <p className="text-purple-300 text-lg">
              {eligible.length} participante{eligible.length !== 1 ? "s" : ""} elegível{eligible.length !== 1 ? "s" : ""}
            </p>
            <p className="text-white/40 text-sm mt-1">{consortium.name}</p>
          </div>

          {/* Lista de participantes */}
          <div className="flex flex-wrap justify-center gap-2 max-w-md">
            {eligible.map((p: any) => (
              <span
                key={p.id}
                className="bg-white/10 text-white/80 text-sm px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm"
              >
                {p.customer_name || p.customer?.name}
              </span>
            ))}
          </div>

          <button
            onClick={startSequence}
            className="relative overflow-hidden group px-12 py-5 rounded-2xl text-white font-black text-xl tracking-wide transition-all hover:scale-105 active:scale-95 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              boxShadow: "0 0 40px rgba(168,85,247,0.6)",
            }}
          >
            <span className="relative z-10 flex items-center gap-3">
              <Zap className="w-6 h-6" />
              INICIAR SORTEIO
            </span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(135deg, #c084fc 0%, #f472b6 100%)" }}
            />
          </button>
        </div>
      )}

      {/* ===== COUNTDOWN ===== */}
      {phase === "countdown" && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-white/50 text-xl font-semibold uppercase tracking-widest">
            Preparando...
          </p>
          <div
            key={countdown}
            className="text-white font-black"
            style={{
              fontSize: "18vw",
              lineHeight: 1,
              animation: "countdownPop 0.8s ease-out forwards",
              textShadow: "0 0 60px rgba(168,85,247,0.8), 0 0 120px rgba(236,72,153,0.5)",
            }}
          >
            {countdown}
          </div>
        </div>
      )}

      {/* ===== ROLLING / SLOWING ===== */}
      {(phase === "rolling" || phase === "slowing") && (
        <div className="flex flex-col items-center gap-8 px-6 text-center">
          <p className="text-white/50 text-lg font-semibold uppercase tracking-widest animate-pulse">
            ✦ Sorteando... ✦
          </p>

          {/* Slot machine frame */}
          <div
            className="relative px-10 py-8 rounded-3xl border-2 overflow-hidden"
            style={{
              borderColor: "rgba(168,85,247,0.5)",
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(10px)",
              minWidth: "min(90vw, 600px)",
            }}
          >
            {/* Glow lines top/bottom */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: "linear-gradient(90deg, transparent, #a855f7, transparent)" }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: "linear-gradient(90deg, transparent, #ec4899, transparent)" }}
            />

            <p
              key={displayed}
              className="text-white font-black text-center"
              style={{
                fontSize: "clamp(2rem, 6vw, 5rem)",
                animation: phase === "slowing" ? "nameFlash 0.3s ease-in-out" : "none",
                textShadow: "0 0 30px rgba(236,72,153,0.6)",
                wordBreak: "break-word",
              }}
            >
              {displayed}
            </p>
          </div>

          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-400"
                style={{
                  animation: `starsBlink 0.6s ${i * 0.12}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ===== WINNER ===== */}
      {phase === "winner" && winner && (
        <div className="flex flex-col items-center gap-6 px-6 text-center max-w-lg w-full">
          {/* Trophy */}
          <div
            style={{ animation: "trophyspin 2s ease-in-out infinite" }}
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                boxShadow: "0 0 60px rgba(245,158,11,0.7)",
              }}
            >
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </div>

          <div style={{ animation: "winnerPop 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
            <p className="text-yellow-300 font-bold text-lg uppercase tracking-widest mb-2">
              🎉 PARABÉNS! 🎉
            </p>
            <p
              className="font-black text-white"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 5rem)",
                lineHeight: 1.1,
                textShadow: "0 0 40px rgba(251,191,36,0.8), 0 0 80px rgba(245,158,11,0.4)",
                wordBreak: "break-word",
              }}
            >
              {winnerName}
            </p>
            <p className="text-white/50 mt-2 text-base">
              {winner.installments_paid}/{consortium.installment_count} parcelas pagas
              {winner.due_day ? ` · Vence dia ${winner.due_day}` : ""}
            </p>
          </div>

          {/* Linha separadora */}
          <div
            className="w-full h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
          />

          {/* Observações */}
          <div className="w-full space-y-1.5">
            <label className="text-white/50 text-sm font-medium">Observações (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Sorteio ao vivo – Abril 2025"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setPhase("idle")
                setWinner(null)
                setConfetti([])
                setDisplayed("")
              }}
              className="flex-1 py-3.5 rounded-xl border border-white/20 text-white/70 font-semibold hover:bg-white/10 transition-colors"
            >
              Sortear de novo
            </button>
            <button
              onClick={confirmWinner}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl font-black text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                boxShadow: "0 0 30px rgba(16,185,129,0.5)",
              }}
            >
              {saving ? "Salvando..." : "✓ Confirmar Ganhador"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
