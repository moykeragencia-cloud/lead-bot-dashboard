import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { leadId } = await req.json()
  if (!leadId) return NextResponse.json({ error: "leadId obrigatório" }, { status: 400 })

  // Busca dados do lead
  const { data: lead } = await supabase
    .from("leads")
    .select("nome, segmento, niche_busca, cidade, contato")
    .eq("id", leadId)
    .single()

  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })

  // Busca histórico de mensagens
  const { data: messages } = await supabase
    .from("messages")
    .select("direction, body, received_at")
    .eq("lead_id", leadId)
    .order("received_at", { ascending: true })
    .limit(20)

  const conversa = (messages ?? [])
    .filter(m => m.body)
    .map(m => `${m.direction === "out" ? "William (Moyker)" : (lead.nome || "Lead")}: ${m.body}`)
    .join("\n")

  const nomeLead = lead.nome || "Lead"
  const segmento = lead.segmento || lead.niche_busca || "e-commerce"

  const systemPrompt = `Você é William, fundador da Moyker, agência especializada em tráfego pago para e-commerces B2C.

POSICIONAMENTO:
- Moyker ajuda e-commerces a escalar faturamento com tráfego pago (Meta Ads + Google Ads)
- Você faz um diagnóstico completo e gratuito de cada cliente antes de qualquer proposta
- Tom: direto, confiante, acessível — como um parceiro de negócios, não um vendedor
- Linguagem informal mas profissional

OBJETIVO DESTA CONVERSA:
Marcar uma call de triagem de 15 minutos. Após a call você entrega um diagnóstico completo gratuito com o que encontrou na análise do negócio deles.

REGRAS PARA A RESPOSTA:
- Máximo 3 linhas curtas (formato WhatsApp)
- Responda ao que o lead disse de forma natural e humana
- Proponha a call de 15 min de forma direta, sem pressão
- NÃO mencione valores, contratos ou preços
- Máximo 1 emoji (ou nenhum)
- NÃO use "prezado", "atenciosamente", "espero que esteja bem"
- Retorne APENAS o texto da mensagem, sem explicações ou formatação extra`

  const userPrompt = `Lead: ${nomeLead} — ${segmento}

Histórico da conversa:
${conversa || "(sem mensagens anteriores registradas)"}

Escreva a próxima mensagem de WhatsApp para dar continuidade e propor a call de 15min.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
    })

    const suggestion = completion.choices[0].message.content?.trim() ?? ""
    return NextResponse.json({ suggestion })
  } catch (err) {
    console.error("[ai-suggestion] OpenAI error:", err)
    return NextResponse.json({ error: "Erro ao gerar sugestão" }, { status: 500 })
  }
}
