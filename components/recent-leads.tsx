import { StatusBadge } from "@/components/status-badge"
import type { Lead } from "@/lib/types"

export function RecentLeads({ leads }: { leads: Lead[] }) {
  if (!leads.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-400 text-sm">Nenhum lead encontrado para o período selecionado.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Lead</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Segmento</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cidade</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Plataforma</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Disparo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{lead.nome || lead.username || "—"}</p>
                {lead.username && lead.nome && (
                  <p className="text-xs text-gray-400">@{lead.username}</p>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">{lead.segmento || "—"}</td>
              <td className="px-4 py-3 text-gray-600">{lead.cidade || "—"}</td>
              <td className="px-4 py-3 text-gray-600">{lead.plataforma || "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={lead.status} />
              </td>
              <td className="px-4 py-3">
                {lead.zapi_status === "ENVIADO" ? (
                  <span className="text-green-600 text-xs font-medium">✓ Enviado</span>
                ) : lead.zapi_status?.startsWith("ERRO") ? (
                  <span className="text-red-500 text-xs">Erro</span>
                ) : (
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
