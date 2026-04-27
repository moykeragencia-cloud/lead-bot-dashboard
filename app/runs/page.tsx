import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Execution } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function RunsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: client } = await supabase
    .from("clients").select("id").eq("user_id", user.id).single()
  if (!client) redirect("/dashboard")

  const { data: executions } = await supabase
    .from("executions")
    .select("*")
    .eq("client_id", client.id)
    .order("started_at", { ascending: false })
    .limit(100)

  return (
    <div className="p-8 space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Execuções</h1>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Data</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Nicho</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cidade</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Captados</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Pré-qual.</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Qualificados</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Disparados</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Taxa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(executions ?? []).map((exec: Execution) => {
              const taxa = exec.captados > 0
                ? Math.round((exec.qualificados / exec.captados) * 100)
                : 0
              return (
                <tr key={exec.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(exec.started_at).toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{exec.niche || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{exec.cidade || "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{exec.captados}</td>
                  <td className="px-4 py-3 text-right text-yellow-600">{exec.pre_qualificados}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{exec.qualificados}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{exec.disparados}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${taxa >= 10 ? "text-green-600" : "text-gray-500"}`}>
                      {taxa}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!executions?.length && (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhuma execução registrada ainda.
          </div>
        )}
      </div>
    </div>
  )
}
