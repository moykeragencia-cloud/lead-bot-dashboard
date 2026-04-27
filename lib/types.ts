export type LeadStatus = "QUALIFICADO" | "PRE_QUALIFICADO" | "DESCARTADO" | "PENDENTE"

export interface Lead {
  id: string
  client_id: string
  data_captacao: string | null
  username: string | null
  nome: string | null
  bio: string | null
  link: string | null
  contato: string | null
  status: LeadStatus
  motivo: string | null
  segmento: string | null
  niche_busca: string | null
  cidade: string | null
  site_url: string | null
  tem_dominio: string | null
  tem_pixel_meta: string | null
  plataforma: string | null
  msg_enviada: string | null
  data_disparo: string | null
  zapi_status: string | null
}

export interface Client {
  id: string
  user_id: string
  name: string
  slug: string
  created_at: string
}

export interface ClientSettings {
  client_id: string
  niches: string[]
  cities: string[]
  meta_dispatch: number
  dispatch_delay: number
  max_dispatch: number
  llm_provider: string
  tab_name: string
  msg_template: string | null
  qualify_prompt: string | null
  updated_at: string
}

export interface Execution {
  id: string
  client_id: string
  started_at: string
  niche: string | null
  cidade: string | null
  captados: number
  pre_qualificados: number
  qualificados: number
  disparados: number
}

export interface DashboardStats {
  captados: number
  pre_qualificados: number
  qualificados: number
  disparados: number
}
