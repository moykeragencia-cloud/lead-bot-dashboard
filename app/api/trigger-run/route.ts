import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { client_id } = await req.json()

  // Valida que o client_id pertence ao usuário logado
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", client_id)
    .eq("user_id", user.id)
    .single()

  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 403 })
  }

  const githubToken = process.env.GITHUB_TOKEN
  const githubOrg   = process.env.GITHUB_ORG   ?? "moykeragencia-cloud"
  const githubRepo  = process.env.GITHUB_REPO  ?? "lead-bot"
  const workflow    = process.env.GITHUB_WORKFLOW ?? "moyker-daily.yml"

  if (!githubToken) {
    return NextResponse.json({ error: "GITHUB_TOKEN não configurado" }, { status: 500 })
  }

  const res = await fetch(
    `https://api.github.com/repos/${githubOrg}/${githubRepo}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { client_id },
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `GitHub API: ${res.status} ${text}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: "Pipeline iniciado com sucesso" })
}
