"use client"

import { useEffect, useRef, useState } from "react"

interface Message {
  id: string
  direction: "in" | "out"
  body: string | null
  media_type: string
  media_url: string | null
  sender_name: string | null
  received_at: string
}

interface ConversationDrawerProps {
  leadId: string
  leadName: string
  phone: string
  zapiStatus: string | null
  onClose: () => void
  onStatusChange?: (leadId: string, newStatus: string) => void
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ConversationDrawer({
  leadId,
  leadName,
  phone,
  zapiStatus: initialStatus,
  onClose,
  onStatusChange,
}: ConversationDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [zapiStatus, setZapiStatus] = useState(initialStatus)
  const [markingProspect, setMarkingProspect] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    setError("")

    fetch(`/api/messages?leadId=${encodeURIComponent(leadId)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setMessages(data.messages ?? [])
      })
      .catch(e => { if (e.name !== "AbortError") setError("Erro ao carregar mensagens") })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [leadId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  async function handleMarkProspect() {
    setMarkingProspect(true)
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zapi_status: "PROSPECT" }),
      })
      if (res.ok) {
        setZapiStatus("PROSPECT")
        onStatusChange?.(leadId, "PROSPECT")
      }
    } finally {
      setMarkingProspect(false)
    }
  }

  const isProspect = zapiStatus === "PROSPECT"

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 truncate">{leadName}</p>
              {isProspect && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
                  ⭐ Prospect
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono">{phone}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
          {loading && (
            <div className="text-center text-sm text-gray-400 mt-8">Carregando...</div>
          )}
          {error && (
            <div className="text-center text-sm text-red-500 mt-8">{error}</div>
          )}
          {!loading && !error && messages.length === 0 && (
            <div className="text-center text-sm text-gray-400 mt-8">
              Nenhuma mensagem registrada.<br />
              <span className="text-xs">Configure o webhook Z-API para capturar conversas.</span>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "out" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  msg.direction === "out"
                    ? "bg-green-500 text-white rounded-br-sm"
                    : "bg-white text-gray-800 shadow-sm rounded-bl-sm border border-gray-100"
                }`}
              >
                {msg.media_type !== "text" && (
                  <p className="text-xs opacity-70 italic mb-0.5">
                    📎 {msg.media_type}
                    {msg.media_url && (
                      <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="ml-1 underline">
                        ver
                      </a>
                    )}
                  </p>
                )}
                {msg.body && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}
                {!msg.body && msg.media_type !== "text" && (
                  <p className="opacity-70 italic text-xs">Mídia sem legenda</p>
                )}
                <p className={`text-[10px] mt-1 ${msg.direction === "out" ? "text-green-100" : "text-gray-400"} text-right`}>
                  {fmtTime(msg.received_at)}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Footer: CTA Prospect */}
        <div className="px-4 py-3 border-t border-gray-100 space-y-2">
          {!isProspect ? (
            <button
              onClick={handleMarkProspect}
              disabled={markingProspect}
              className="w-full py-2 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {markingProspect ? "Salvando..." : "⭐ Marcar como Prospect"}
            </button>
          ) : (
            <p className="text-center text-xs text-emerald-600 font-medium">⭐ Lead marcado como Prospect</p>
          )}
          <p className="text-center text-xs text-gray-400">Para responder, use o WhatsApp direto.</p>
        </div>
      </div>
    </>
  )
}
