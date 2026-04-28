"use client"

import { useState } from "react"

interface InboxLead {
  leadId: string
  leadName: string
  segmento: string | null
  lastMessage: string
  receivedAt: string
  zapiStatus: string | null
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "agora"
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

function LeadCard({ lead }: { lead: InboxLead }) {
  const [suggestion, setSuggestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generateSuggestion() {
    setLoading(true)
    setSuggestion("")
    try {
      const res = await fetch("/api/ai-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.leadId }),
      })
      const data = await res.json()
      if (data.suggestion) setSuggestion(data.suggestion)
    } catch {
      setSuggestion("Erro ao gerar sugestão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  async function copySuggestion() {
    await navigator.clipboard.writeText(suggestion)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
      {/* Lead info */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{lead.leadName}</p>
          <p className="text-xs text-gray-400">{lead.segmento || "e-commerce"}</p>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(lead.receivedAt)}</span>
      </div>

      {/* Última mensagem */}
      <div className="bg-blue-50 rounded-lg px-3 py-2">
        <p className="text-xs text-gray-500 mb-0.5">Última mensagem do lead:</p>
        <p className="text-sm text-gray-800 line-clamp-2">{lead.lastMessage}</p>
      </div>

      {/* Sugestão de IA */}
      {!suggestion && (
        <button
          onClick={generateSuggestion}
          disabled={loading}
          className="w-full py-2 text-xs font-medium rounded-lg border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Gerando sugestão...
            </span>
          ) : "✨ Sugerir resposta com IA"}
        </button>
      )}

      {suggestion && (
        <div className="space-y-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Sugestão de resposta:</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{suggestion}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copySuggestion}
              className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              {copied ? "✓ Copiado!" : "Copiar"}
            </button>
            <button
              onClick={generateSuggestion}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading ? "..." : "↺"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface InboxBoxProps {
  leads: InboxLead[]
}

export function InboxBox({ leads }: InboxBoxProps) {
  if (leads.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-5 py-6 text-center">
        <p className="text-2xl mb-1">✅</p>
        <p className="text-sm font-medium text-gray-700">Tudo em dia</p>
        <p className="text-xs text-gray-400 mt-0.5">Nenhum lead aguardando resposta</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {leads.map(lead => (
        <LeadCard key={lead.leadId} lead={lead} />
      ))}
    </div>
  )
}
