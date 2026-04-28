import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

const CLIENT_ID = process.env.SUPABASE_CLIENT_ID ?? ""

export async function POST(req: NextRequest) {

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Ignorar eventos que não são mensagens
  const type = payload.type as string | undefined
  if (type && !["ReceivedCallback", "SentCallback", "DeliveredCallback", "ReadCallback"].includes(type)) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const messageId  = (payload.messageId ?? payload.zaapId ?? "") as string
  const fromMe     = payload.fromMe as boolean ?? false
  const phone      = normalizePhone((payload.phone ?? payload.chatId ?? "") as string)
  const senderName = (payload.senderName ?? payload.chatName ?? "") as string
  const momment    = payload.momment as number | undefined
  const receivedAt = momment ? new Date(momment).toISOString() : new Date().toISOString()

  // Extrair corpo da mensagem
  let body = ""
  let mediaType = "text"
  let mediaUrl: string | undefined

  const text = payload.text as Record<string, unknown> | undefined
  const image = payload.image as Record<string, unknown> | undefined
  const audio = payload.audio as Record<string, unknown> | undefined
  const video = payload.video as Record<string, unknown> | undefined
  const document = payload.document as Record<string, unknown> | undefined

  if (text?.message) {
    body = text.message as string
    mediaType = "text"
  } else if (image) {
    body = (image.caption as string) ?? ""
    mediaType = "image"
    mediaUrl = image.imageUrl as string
  } else if (audio) {
    mediaType = "audio"
    mediaUrl = audio.audioUrl as string
  } else if (video) {
    body = (video.caption as string) ?? ""
    mediaType = "video"
    mediaUrl = video.videoUrl as string
  } else if (document) {
    body = (document.fileName as string) ?? ""
    mediaType = "document"
    mediaUrl = document.documentUrl as string
  }

  if (!messageId || !phone) {
    return NextResponse.json({ ok: true, skipped: true, reason: "no messageId or phone" })
  }

  const supabase = createServiceClient()

  // Busca lead pelo número de telefone
  const { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("client_id", CLIENT_ID)
    .ilike("contato", `%${phone.slice(-9)}%`)   // últimos 9 dígitos para flexibilidade
    .limit(1)
    .maybeSingle()

  // Salva a mensagem
  const { error } = await supabase.from("messages").upsert({
    id:          messageId,
    client_id:   CLIENT_ID,
    lead_id:     lead?.id ?? null,
    phone,
    direction:   fromMe ? "out" : "in",
    body,
    media_type:  mediaType,
    media_url:   mediaUrl ?? null,
    sender_name: fromMe ? "Você" : senderName,
    received_at: receivedAt,
    raw:         payload,
  }, { onConflict: "id" })

  if (error) {
    console.error("[webhook/zapi] Supabase error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Se for mensagem recebida (resposta do cliente), marca o lead como "RESPONDEU"
  // Se for mensagem recebida, avança o status (nunca volta nem sobrescreve PROSPECT)
  if (!fromMe && lead?.id) {
    await supabase
      .from("leads")
      .update({ zapi_status: "RESPONDEU" })
      .eq("id", lead.id)
      .eq("zapi_status", "ENVIADO")   // ENVIADO → RESPONDEU (não toca PROSPECT)
  }

  return NextResponse.json({ ok: true })
}

function normalizePhone(raw: string): string {
  // Remove @c.us, @s.whatsapp.net, espaços, traços
  return raw.replace(/@.+$/, "").replace(/\D/g, "")
}
