"use client"

import Link from "next/link"

interface ModalLead {
  id: string
  nome: string | null
  username: string | null
  segmento: string | null
  status: string | null
  zapi_status: string | null
  data_captacao: string | null
}

interface FunnelModalProps {
  leads: ModalLead[]
  title: string
  closeHref: string
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    QUALIFICADO:    { label: "Qual.", cls: "bg-green-100 text-green-700" },
    DESCARTADO:     { label: "Desc.", cls: "bg-red-100 text-red-600" },
    PRE_QUALIFICADO:{ label: "Pré",   cls: "bg-yellow-100 text-yellow-700" },
    PENDENTE:       { label: "Pend.", cls: "bg-gray-100 text-gray-500" },
  }
  const s = map[status ?? ""] ?? { label: "Pend.", cls: "bg-gray-100 text-gray-500" }
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
}

function ZapiBadge({ zapi }: { zapi: string | null }) {
  if (!zapi) return <span className="text-[10px] text-gray-300">—</span>
  const map: Record<string, { label: string; cls: string }> = {
    PROSPECT: { label: "⭐ Prospect", cls: "text-emerald-600 font-semibold" },
    RESPONDEU:{ label: "💬 Respondeu", cls: "text-purple-600" },
    ENVIADO:  { label: "✓ Enviado",   cls: "text-blue-600" },
  }
  const z = map[zapi] ?? { label: zapi, cls: "text-gray-400" }
  return <span className={`text-[11px] ${z.cls}`}>{z.label}</span>
}

export function FunnelModal({ leads, title, closeHref }: FunnelModalProps) {
  return (
    <>
      {/* Backdrop */}
      <Link href={closeHref} className="fixed inset-0 bg-black/40 z-40" aria-label="Fechar" />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{leads.length} lead{leads.length !== 1 ? "s" : ""}</p>
          </div>
          <Link
            href={closeHref}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            ✕
          </Link>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-sm">Nenhum lead neste filtro</p>
            </div>
          ) : (
            leads.map(lead => (
              <div key={lead.id} className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {lead.nome || lead.username || "—"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{lead.segmento || "—"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ZapiBadge zapi={lead.zapi_status} />
                  <StatusBadge status={lead.status} />
                  <span className="text-[10px] text-gray-300">{fmtDate(lead.data_captacao)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
