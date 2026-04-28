import Link from "next/link"

function pct(num: number, den: number) {
  if (!den || !num) return null
  return Math.round((num / den) * 100)
}

interface StepProps {
  label: string
  value: number
  icon: string
  color: string
  ring: string
  href: string
  convRate?: number | null
}

function FunnelStep({ label, value, icon, color, ring, href, convRate }: StepProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {convRate !== undefined && (
        <div className="flex flex-col items-center gap-0.5">
          <span className={`text-[11px] font-semibold tabular-nums ${
            convRate === null ? "text-gray-300" :
            convRate >= 50 ? "text-green-500" :
            convRate >= 25 ? "text-yellow-500" : "text-red-400"
          }`}>
            {convRate === null ? "—" : `${convRate}%`}
          </span>
          <svg className="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
      <Link
        href={href}
        className={`group flex flex-col items-center justify-center rounded-2xl border-2 ${ring} px-6 py-4 min-w-[120px] bg-white hover:shadow-md transition-all`}
      >
        <span className="text-xl mb-1">{icon}</span>
        <span className={`text-3xl font-bold tabular-nums ${color}`}>{value}</span>
        <span className="text-xs text-gray-400 font-medium mt-0.5">{label}</span>
      </Link>
    </div>
  )
}

interface FunnelCardsProps {
  captados: number
  qualificados: number
  disparados: number
  respondidos: number
  prospects: number
  since: string
  until: string
  preset?: string
}

export function FunnelCards({
  captados, qualificados, disparados, respondidos, prospects,
  since, until, preset,
}: FunnelCardsProps) {
  const dateParam = preset ? `preset=${preset}` : `from=${since}&to=${until}`

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      <FunnelStep
        label="Captados"
        value={captados}
        icon="🎯"
        color="text-gray-800"
        ring="border-gray-200"
        href={`/leads?${dateParam}`}
      />
      <FunnelStep
        label="Qualificados"
        value={qualificados}
        icon="✅"
        color="text-blue-600"
        ring="border-blue-200"
        href={`/leads?${dateParam}&status=QUALIFICADO`}
        convRate={pct(qualificados, captados)}
      />
      <FunnelStep
        label="Disparados"
        value={disparados}
        icon="📤"
        color="text-indigo-600"
        ring="border-indigo-200"
        href={`/leads?${dateParam}&zapi_filter=disparados`}
        convRate={pct(disparados, qualificados)}
      />
      <FunnelStep
        label="Respondidos"
        value={respondidos}
        icon="💬"
        color="text-purple-600"
        ring="border-purple-200"
        href={`/leads?${dateParam}&zapi_filter=respondidos`}
        convRate={pct(respondidos, disparados)}
      />
      <FunnelStep
        label="Prospects"
        value={prospects}
        icon="⭐"
        color="text-emerald-600"
        ring="border-emerald-200"
        href={`/leads?${dateParam}&zapi_filter=prospects`}
        convRate={pct(prospects, respondidos)}
      />
    </div>
  )
}
