import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RecentLeads } from "@/components/recent-leads"
import { TriggerButton } from "@/components/trigger-button"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { FunnelCards } from "@/components/funnel-cards"
import { InboxBox } from "@/components/inbox-box"
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

  // ── Funil ─────────────────────────────────────────────────────────────────
  const { data: leads } = await supabase
    .from("leads")
    .select("id, status, zapi_status")
    .eq("client_id", client.id)
    .gte("data_captacao", sinceISO)
    .lte("data_captacao", untilISO)

  const allLeads = leads ?? []
  const captados    = allLeads.length
  const qualificados = allLeads.filter(l => l.status === "QUALIFICADO").length
  const disparados  = allLeads.filter(l =>
    ["ENVIADO", "RESPONDEU", "PROSPECT"].includes(l.zapi_status ?? "")
  ).length
  const respondidos = allLeads.filter(l =>
    ["RESPONDEU", "PROSPECT"].includes(l.zapi_status ?? "")
  ).length
  const prospects   = allLeads.filter(l => l.zapi_status === "PROSPECT").length

  // ── Inbox: leads que responderam e aguardam reply ─────────────────────────
  const respondeuIds = allLeads
    .filter(l => ["RESPONDEU", "PROSPECT"].includes(l.zapi_status ?? ""))
    .map(l => l.id)

  let inboxLeads: {
    leadId: string; leadName: string; segmento: string | null
    lastMessage: string; receivedAt: string; zapiStatus: string | null
  }[] = []

  if (respondeuIds.length > 0) {
    // Busca última mensagem de cada lead que respondeu
    const { data: lastMessages } = await supabase
      .from("messages")
      .select("lead_id, direction, body, received_at")
      .in("lead_id", respondeuIds)
      .order("received_at", { ascending: false })

    // Agrupa: pega só a última mensagem por lead
    const byLead: Record<string, typeof lastMessages extends (infer T)[] | null ? T : never> = {}
    for (const msg of lastMessages ?? []) {
      if (msg.lead_id && !byLead[msg.lead_id]) {
        byLead[msg.lead_id] = msg
      }
    }

    // Filtra só os que têm última mensagem = "in" (aguardando nossa resposta)
    const waitingIds = Object.entries(byLead)
      .filter(([, msg]) => msg.direction === "in")
      .map(([id]) => id)

    if (waitingIds.length > 0) {
      const { data: leadDetails } = await supabase
        .from("leads")
        .select("id, nome, username, segmento, zapi_status")
        .in("id", waitingIds)

      inboxLeads = waitingIds.map(id => {
        const lead = leadDetails?.find(l => l.id === id)
        const msg = byLead[id]
        return {
          leadId: id,
          leadName: lead?.nome || lead?.username || "Lead",
          segmento: lead?.segmento ?? null,
          lastMessage: msg?.body ?? "(mídia)",
          receivedAt: msg?.received_at ?? new Date().toISOString(),
          zapiStatus: lead?.zapi_status ?? null,
        }
      })
    }
  }

  // ── Última execução ───────────────────────────────────────────────────────
  const { data: lastRun } = await supabase
    .from("executions")
    .select("started_at, captados, qualificados, disparados")
    .eq("client_id", client.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // ── Leads recentes ────────────────────────────────────────────────────────
  const { data: recentLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("client_id", client.id)
    .gte("data_captacao", sinceISO)
    .lte("data_captacao", untilISO)
    .order("data_captacao", { ascending: false })
    .limit(10)

  function fmtRunDate(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <div className="p-8 space-y-7">
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

      {/* Inbox + Última execução */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Inbox: aguardando resposta */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Aguardando resposta
              {inboxLeads.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {inboxLeads.length}
                </span>
              )}
            </h2>
          </div>
          <InboxBox leads={inboxLeads} />
        </div>

        {/* Coluna direita: execução + leads recentes */}
        <div className="space-y-4">

          {/* Última execução */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Última execução</p>
            {lastRun ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">{fmtRunDate(lastRun.started_at)}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-800">{lastRun.captados}</p>
                    <p className="text-[10px] text-gray-400">captados</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{lastRun.qualificados}</p>
                    <p className="text-[10px] text-gray-400">qualificados</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-indigo-600">{lastRun.disparados}</p>
                    <p className="text-[10px] text-gray-400">disparados</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Nenhuma execução ainda.</p>
            )}
          </div>

          {/* Leads recentes mini */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Leads recentes</p>
            <div className="space-y-2">
              {(recentLeads ?? []).slice(0, 6).map((lead: Lead) => (
                <div key={lead.id} className="flex items-center justify-between gap-2">
                  <p className="text-sm text-gray-700 truncate">
                    {lead.nome || lead.username || "—"}
                  </p>
                  <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    lead.status === "QUALIFICADO"
                      ? "bg-green-100 text-green-700"
                      : lead.status === "DESCARTADO"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {lead.status === "QUALIFICADO" ? "Qual." :
                     lead.status === "DESCARTADO" ? "Desc." :
                     lead.status === "PRE_QUALIFICADO" ? "Pré" : "Pend."}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
