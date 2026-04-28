import Link from "next/link"

interface FunnelStep {
  label: string
  value: number
  prev?: number
  color: string
  bg: string
  href: string
}

function pct(num: number, den: number) {
  if (!den) return null
  return Math.round((num / den) * 100)
}

function Arrow({ rate }: { rate: number | null }) {
  if (rate === null) return null
  const color = rate >= 50 ? "text-green-500" : rate >= 25 ? "text-yellow-500" : "text-red-400"
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
      <span className={`text-xs font-medium ${color}`}>{rate}%</span>
      <svg className="text-gray-300 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
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
  captados,
  qualificados,
  disparados,
  respondidos,
  prospects,
  since,
  until,
  preset,
}: FunnelCardsProps) {
  const dateParam = preset ? `preset=${preset}` : `from=${since}&to=${until}`

  const steps: FunnelStep[] = [
    {
      label: "Captados",
      value: captados,
      color: "text-gray-700",
      bg: "bg-gray-50 hover:bg-gray-100",
      href: `/leads?${dateParam}`,
    },
    {
      label: "Qualificados",
      value: qualificados,
      prev: captados,
      color: "text-blue-700",
      bg: "bg-blue-50 hover:bg-blue-100",
      href: `/leads?${dateParam}&status=QUALIFICADO`,
    },
    {
      label: "Disparados",
      value: disparados,
      prev: qualificados,
      color: "text-indigo-700",
      bg: "bg-indigo-50 hover:bg-indigo-100",
      href: `/leads?${dateParam}&zapi_filter=disparados`,
    },
    {
      label: "Respondidos",
      value: respondidos,
      prev: disparados,
      color: "text-purple-700",
      bg: "bg-purple-50 hover:bg-purple-100",
      href: `/leads?${dateParam}&zapi_filter=respondidos`,
    },
    {
      label: "Prospects",
      value: prospects,
      prev: respondidos,
      color: "text-emerald-700",
      bg: "bg-emerald-50 hover:bg-emerald-100",
      href: `/leads?${dateParam}&zapi_filter=prospects`,
    },
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const rate = i > 0 ? pct(step.value, step.prev ?? 0) : null
        return (
          <div key={step.label} className="flex items-center gap-2 shrink-0">
            {i > 0 && <Arrow rate={rate} />}
            <Link
              href={step.href}
              className={`flex flex-col items-center justify-center rounded-xl border border-gray-100 px-5 py-4 min-w-[110px] transition-colors ${step.bg}`}
            >
              <span className={`text-2xl font-bold ${step.color}`}>{step.value}</span>
              <span className="text-xs text-gray-500 mt-0.5 font-medium">{step.label}</span>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
