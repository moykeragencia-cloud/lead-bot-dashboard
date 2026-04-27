"use client"

import { useState } from "react"
import { PlayCircle, Loader2 } from "lucide-react"

export function TriggerButton({ clientId }: { clientId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleTrigger() {
    setState("loading")
    setMessage("")

    try {
      const res = await fetch("/api/trigger-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      })
      const data = await res.json()

      if (res.ok) {
        setState("success")
        setMessage("Pipeline iniciado no GitHub Actions!")
      } else {
        setState("error")
        setMessage(data.error ?? "Erro ao iniciar pipeline.")
      }
    } catch {
      setState("error")
      setMessage("Falha na conexão.")
    }

    setTimeout(() => setState("idle"), 4000)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleTrigger}
        disabled={state === "loading"}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {state === "loading" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <PlayCircle size={16} />
        )}
        {state === "loading" ? "Iniciando..." : "Rodar agora"}
      </button>
      {message && (
        <p className={`text-xs ${state === "success" ? "text-green-600" : "text-red-500"}`}>
          {message}
        </p>
      )}
    </div>
  )
}
