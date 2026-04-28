import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Garante que o lead pertence ao client do usuário
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const body = await req.json()
  const allowed = ["zapi_status", "status"]
  const update: Record<string, string> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nenhum campo permitido para atualizar" }, { status: 400 })
  }

  const { error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", id)
    .eq("client_id", client.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
