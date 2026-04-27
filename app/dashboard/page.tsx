import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StatsCards } from "@/components/stats-cards"
import { RecentLeads } from "@/components/recent-leads"
import { TriggerButton } from "@/components/trigger-button"
import type { Lead, DashboardStats } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

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

  // Stats de hoje
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayLeads } = await supabase
    .from("leads")
    .select("status, zapi_status")
    .eq("client_id", client.id)
    .gte("data_captacao", today.toISOString())

  const { data: todayDispatched } = await supabase
    .from("leads")
    .select("id", { count: "exact" })
    .eq("client_id", client.id)
    .eq("zapi_status", "ENVIADO")
    .gte("data_disparo", today.toISOString())

  const stats: DashboardStats = {
    captados:         todayLeads?.length ?? 0,
    pre_qualificados: todayLeads?.filter(l => l.status === "PRE_QUALIFICADO").length ?? 0,
    qualificados:     todayLeads?.filter(l => l.status === "QUALIFICADO").length ?? 0,
    disparados:       todayDispatched?.length ?? 0,
  }

  // Últimos 20 leads qualificados
  const { data: recentLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("client_id", client.id)
    .order("data_captacao", { ascending: false })
    .limit(20)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <TriggerButton clientId={client.id} />
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
