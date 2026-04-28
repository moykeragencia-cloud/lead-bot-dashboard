import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RecentLeads } from "@/components/recent-leads"
import { TriggerButton } from "@/components/trigger-button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { FunnelCards } from "@/components/funnel-cards"
import { getEffectiveDateRange, rangeLabel } from "@/lib/date-utils"
import type { Lead } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const { since, until } = getEffectiveDateRange(
    params.preset ?? "last_30d",
    params.from,
    params.to,
  )
  const sinceISO = since + "T00:00:00"
  const untilISO = until + "T23:59:59"

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("user_id", user.id)
    .single()

  if (!client) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Conta não configurada. Entre em contato com o administrador.</p>
      </div>
    )
  }

  // Busca todos os leads do período com os campos necessários para o funil
  const { data: leads } = await supabase
    .from("leads")
    .select("id, status, zapi_status, data_captacao, data_disparo")
    .eq("client_id", client.id)
    .gte("data_captacao", sinceISO)
    .lte("data_captacao", untilISO)

  const allLeads = leads ?? []

  const captados    = allLeads.length
  const qualificados = allLeads.filter(l => l.status === "QUALIFICADO").length
  const disparados  = allLeads.filter(l =>
    l.zapi_status === "ENVIADO" || l.zapi_status === "RESPONDEU" || l.zapi_status === "PROSPECT"
  ).length
  const respondidos = allLeads.filter(l =>
    l.zapi_status === "RESPONDEU" || l.zapi_status === "PROSPECT"
  ).length
  const prospects   = allLeads.filter(l => l.zapi_status === "PROSPECT").length

  const { data: recentLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("client_id", client.id)
    .gte("data_captacao", sinceISO)
    .lte("data_captacao", untilISO)
    .order("data_captacao", { ascending: false })
    .limit(20)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rangeLabel(since, until)}</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker />
          <TriggerButton clientId={client.id} />
        </div>
      </div>

      {/* Funil */}
      <FunnelCards
        captados={captados}
        qualificados={qualificados}
        disparados={disparados}
        respondidos={respondidos}
        prospects={prospects}
        since={since}
        until={until}
        preset={params.preset}
      />

      {/* Leads recentes */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Leads recentes</h2>
        <RecentLeads leads={(recentLeads ?? []) as Lead[]} />
      </div>
    </div>
  )
}
