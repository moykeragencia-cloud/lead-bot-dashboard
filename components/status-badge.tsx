import type { LeadStatus } from "@/lib/types"

const config: Record<LeadStatus, { label: string; className: string }> = {
  QUALIFICADO:     { label: "Qualificado",     className: "bg-green-100 text-green-700" },
  PRE_QUALIFICADO: { label: "Pré-qualificado", className: "bg-yellow-100 text-yellow-700" },
  DESCARTADO:      { label: "Descartado",      className: "bg-red-100 text-red-700" },
  PENDENTE:        { label: "Pendente",         className: "bg-gray-100 text-gray-600" },
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const { label, className } = config[status] ?? config.PENDENTE
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
