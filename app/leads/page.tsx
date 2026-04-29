import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { LeadsTable } from "@/components/leads-table"
import { getEffectiveDateRange, rangeLabel } from "@/lib/date-utils"
import type { LeadStatus } from "@/lib/types"

export const dynamic = "force-dynamic"

const STATUS_OPTIONS: LeadStatus[] = ["QUALIFICADO", "PRE_QUALIFICADO", "DESCARTADO", "PENDENTE"]

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; nicho?: string; cidade?: string; page?: string; preset?: string; from?: string; to?: string; zapi_filter?: string }>
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

  const { since, until } = getEffectiveDateRange(
    params.preset ?? "last_30d",
    params.from,
    params.to,
  )
  const sinceISO = since + "T00:00:00"
  const untilISO = until + "T23:59:59"

  const page   = Math.max(1, parseInt(params.page ?? "1"))
  const limit  = 50
  const offset = (page - 1) * limit

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("client_id", client.id)
    .gte("data_captacao", sinceISO)
    .lte("data_captacao", untilISO)
    .order("data_captacao", { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.status) query = query.eq("status", params.status)
  if (params.nicho)  query = query.eq("niche_busca", params.nicho)
  if (params.cidade) query = query.eq("cidade", params.cidade)

  // Filtro do funil (vindo do dashboard)
  if (params.zapi_filter === "disparados") {
    query = query.in("zapi_status", ["ENVIADO", "RESPONDEU", "PROSPECT"])
  } else if (params.zapi_filter === "respondidos") {
    query = query.in("zapi_status", ["RESPONDEU", "PROSPECT"])
  } else if (params.zapi_filter === "prospects") {
    query = query.eq("zapi_status", "PROSPECT")
  }

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

  function buildUrl(base: Record<string, string | undefined>, overrides: Record<string, string>) {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...base, ...overrides })) {
      if (v) p.set(k, v)
    }
    return `/leads?${p.toString()}`
  }

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count ?? 0} leads · {rangeLabel(since, until)}</p>
        </div>
        <DateRangePicker />
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

        <select
          name="zapi_filter"
          defaultValue={params.zapi_filter ?? ""}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os disparos</option>
          <option value="disparados">📤 Disparados</option>
          <option value="respondidos">💬 Respondidos</option>
          <option value="prospects">⭐ Prospects</option>
        </select>

        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Filtrar
        </button>

        <a
          href={`/leads${params.preset ? `?preset=${params.preset}` : params.from ? `?from=${params.from}&to=${params.to}` : ""}`}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Limpar
        </a>
      </form>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <LeadsTable leads={leads ?? []} />

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2 text-sm">
            {page > 1 && (
              <a
                href={buildUrl(params, { page: String(page - 1) })}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Anterior
              </a>
            )}
            <span className="text-gray-500">Página {page} de {totalPages}</span>
            {page < totalPages && (
              <a
                href={buildUrl(params, { page: String(page + 1) })}
                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Próxima
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
