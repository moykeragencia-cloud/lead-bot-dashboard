"use client"

import { useState } from "react"
import { StatusBadge } from "@/components/status-badge"
import { ConversationDrawer } from "@/components/conversation-drawer"
import type { Lead } from "@/lib/types"

interface LeadsTableProps {
  leads: Lead[]
}

export function LeadsTable({ leads }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Lead</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Contato</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Segmento</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cidade</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Plataforma</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Pixel</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Disparo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {leads.map((lead: Lead) => (
            <tr
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className="hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900 truncate max-w-[140px]">
                  {lead.nome || lead.username || "—"}
                </p>
                {lead.site_url ? (
                  <a
                    href={lead.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-blue-500 hover:underline truncate max-w-[140px] block"
                  >
                    {lead.site_url.replace(/^https?:\/\//, "").slice(0, 30)}
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">@{lead.username}</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                {lead.contato || "—"}
              </td>
              <td className="px-4 py-3 text-gray-600 text-xs">{lead.segmento || "—"}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{lead.cidade || "—"}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{lead.plataforma || "—"}</td>
              <td className="px-4 py-3">
                {lead.tem_pixel_meta === "SIM" ? (
                  <span className="text-green-600 text-xs font-medium">✓ SIM</span>
                ) : lead.tem_pixel_meta === "NÃO" ? (
                  <span className="text-red-400 text-xs">NÃO</span>
                ) : (
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.status} />
              </td>
              <td className="px-4 py-3 text-xs">
                {lead.zapi_status === "RESPONDEU" ? (
                  <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Respondeu
                  </span>
                ) : lead.zapi_status === "ENVIADO" ? (
                  <span className="text-green-600 font-medium">✓ Enviado</span>
                ) : lead.zapi_status?.startsWith("ERRO") ? (
                  <span className="text-red-500">Erro</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedLead && (
        <ConversationDrawer
          leadId={selectedLead.id}
          leadName={selectedLead.nome || selectedLead.username || selectedLead.contato || "Lead"}
          phone={selectedLead.contato || ""}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </>
  )
}
