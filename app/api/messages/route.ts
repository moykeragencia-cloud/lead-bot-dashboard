import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId")
  const phone  = req.nextUrl.searchParams.get("phone")

  if (!leadId && !phone) {
    return NextResponse.json({ error: "leadId ou phone obrigatório" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Determina client_id do usuário
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  let query = supabase
    .from("messages")
    .select("id, direction, body, media_type, media_url, sender_name, received_at")
    .eq("client_id", client.id)
    .order("received_at", { ascending: true })
    .limit(100)

  if (leadId) {
    query = query.eq("lead_id", leadId)
  } else if (phone) {
    // últimos 9 dígitos para flexibilidade de prefixo
    query = query.ilike("phone", `%${phone.slice(-9)}`)
  }

  const { data: messages, error } = await query

  if (error) {
    console.error("[api/messages] error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: messages ?? [] })
}
