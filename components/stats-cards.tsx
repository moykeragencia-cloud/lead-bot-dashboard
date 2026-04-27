import type { DashboardStats } from "@/lib/types"

const cards = [
  { key: "captados",         label: "Captados",          color: "text-gray-700",  bg: "bg-gray-100" },
  { key: "pre_qualificados", label: "Pré-qualificados",  color: "text-yellow-700", bg: "bg-yellow-50" },
  { key: "qualificados",     label: "Qualificados",      color: "text-green-700",  bg: "bg-green-50" },
  { key: "disparados",       label: "Disparados",        color: "text-blue-700",   bg: "bg-blue-50" },
] as const

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, color, bg }) => (
        <div key={key} className={`${bg} rounded-xl p-4`}>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{stats[key as keyof DashboardStats]}</p>
        </div>
      ))}
    </div>
  )
}
