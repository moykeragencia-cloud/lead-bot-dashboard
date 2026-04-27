import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ConfigForm } from "@/components/config-form"

export const dynamic = "force-dynamic"

export default async function ConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("user_id", user.id)
    .single()

  if (!client) redirect("/dashboard")

  const { data: settings } = await supabase
    .from("client_settings")
    .select("*")
    .eq("client_id", client.id)
    .single()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Parâmetros do pipeline de prospecção — {client.name}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {settings ? (
          <ConfigForm settings={settings} clientId={client.id} />
        ) : (
          <p className="text-sm text-gray-500">Configurações não encontradas.</p>
        )}
      </div>
    </div>
  )
}
