import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StatsCards } from "@/components/stats-cards"
import { RecentLeads } from "@/components/recent-leads"
import { TriggerButton } from "@/components/trigger-button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { getEffectiveDateRange, rangeLabel } from "@/lib/date-utils"
import type { Lead, DashboardStats } from "@/lib/types"

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

  // Busca client_id do usuário logado
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

  const { data: periodLeads } = await supabase
    .from("leads")
    .select("status, zapi_status")
    .eq("client_id", client.id)
    .gte("data_captacao", sinceISO)
    .lte("data_captacao", untilISO)

  const { data: periodDispatched } = await supabase
    .from("leads")
    .select("id", { count: "exact" })
    .eq("client_id", client.id)
    .eq("zapi_status", "ENVIADO")
    .gte("data_disparo", sinceISO)
    .lte("data_disparo", untilISO)

  const stats: DashboardStats = {
    captados:         periodLeads?.length ?? 0,
    pre_qualificados: periodLeads?.filter(l => l.status === "PRE_QUALIFICADO").length ?? 0,
    qualificados:     periodLeads?.filter(l => l.status === "QUALIFICADO").length ?? 0,
    disparados:       periodDispatched?.length ?? 0,
  }

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

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Leads recentes */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 mb-3">Leads recentes</h2>
        <RecentLeads leads={(recentLeads ?? []) as Lead[]} />
      </div>
    </div>
  )
}
