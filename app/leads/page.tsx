import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StatusBadge } from "@/components/status-badge"
import type { Lead, LeadStatus } from "@/lib/types"

export const dynamic = "force-dynamic"

const STATUS_OPTIONS: LeadStatus[] = ["QUALIFICADO", "PRE_QUALIFICADO", "DESCARTADO", "PENDENTE"]

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; nicho?: string; cidade?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!client) redirect("/dashboard")

  const page   = Math.max(1, parseInt(params.page ?? "1"))
  const limit  = 50
  const offset = (page - 1) * limit

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("client_id", client.id)
    .order("data_captacao", { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.status) query = query.eq("status", params.status)
  if (params.nicho)  query = query.eq("niche_busca", params.nicho)
  if (params.cidade) query = query.eq("cidade", params.cidade)

  const { data: leads, count } = await query
  const totalPages = Math.ceil((count ?? 0) / limit)

  // Valores únicos para filtros
  const { data: niches } = await supabase
    .from("leads")
    .select("niche_busca")
    .eq("client_id", client.id)
    .not("niche_busca", "is", null)
  const { data: cities } = await supabase
    .from("leads")
    .select("cidade")
    .eq("client_id", client.id)
    .not("cidade", "is", null)

  const uniqueNiches = [...new Set(niches?.map(n => n.niche_busca).filter(Boolean))] as string[]
  const uniqueCities = [...new Set(cities?.map(c => c.cidade).filter(Boolean))] as string[]

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count ?? 0} leads no total</p>
        </div>
      </div>

      {/* Filtros */}
      <form method="get" className="flex gap-3 flex-wrap">
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          name="nicho"
          defaultValue={params.nicho ?? ""}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os nichos</option>
          {uniqueNiches.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        <select
          name="cidade"
          defaultValue={params.cidade ?? ""}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as cidades</option>
          {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Filtrar
        </button>

        <a
          href="/leads"
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Limpar
        </a>
      </form>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
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
            {(leads ?? []).map((lead: Lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 truncate max-w-[140px]">
                    {lead.nome || lead.username || "—"}
                  </p>
                  {lead.site_url ? (
                    <a
                      href={lead.site_url}
                      target="_blank"
                      rel="noopener noreferrer"
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
                  {lead.zapi_status === "ENVIADO" ? (
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

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 text-sm">
            {page > 1 && (
              <a href={`?page=${page - 1}${params.status ? `&status=${params.status}` : ""}`}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                ← Anterior
              </a>
            )}
            <span className="text-gray-500">Página {page} de {totalPages}</span>
            {page < totalPages && (
              <a href={`?page=${page + 1}${params.status ? `&status=${params.status}` : ""}`}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                Próxima →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
