-- ================================================================
-- Lead Bot Dashboard — Schema Inicial
-- Executar no Supabase SQL Editor (projeto lead-bot-db)
-- ================================================================

-- Clientes (um por organização)
CREATE TABLE clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users NOT NULL,
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Configuração do bot por cliente
CREATE TABLE client_settings (
  client_id              UUID PRIMARY KEY REFERENCES clients ON DELETE CASCADE,
  niches                 TEXT[] DEFAULT ARRAY[
    'loja de roupas online', 'cosméticos beleza', 'suplementos alimentares',
    'pet shop online', 'decoração casa', 'artesanato handmade',
    'moda fitness', 'produtos naturais'
  ],
  cities                 TEXT[] DEFAULT ARRAY['São Paulo', 'Rio de Janeiro', 'Belo Horizonte'],
  meta_dispatch          INT DEFAULT 20,
  dispatch_delay         INT DEFAULT 60,
  max_dispatch           INT DEFAULT 20,
  llm_provider           TEXT DEFAULT 'openai',
  tab_name               TEXT DEFAULT 'Moyker',
  msg_template           TEXT DEFAULT 'Olá, {nome}! Tudo bem? Aqui é o William.
---
Trabalho ajudando e-commerces de {segmento} a aumentar faturamento com tráfego pago.
---
Fiz uma análise rápida do perfil de vocês e acho que estão deixando dinheiro na mesa. Posso te enviar o que encontrei?',
  qualify_prompt         TEXT,
  updated_at             TIMESTAMPTZ DEFAULT now()
);

-- Leads (tabela principal de dados)
CREATE TABLE leads (
  id              TEXT PRIMARY KEY,
  client_id       UUID REFERENCES clients NOT NULL,
  data_captacao   TIMESTAMPTZ DEFAULT now(),
  username        TEXT,
  nome            TEXT,
  bio             TEXT,
  link            TEXT,
  contato         TEXT,
  status          TEXT DEFAULT 'PENDENTE',
  motivo          TEXT,
  segmento        TEXT,
  niche_busca     TEXT,
  cidade          TEXT,
  site_url        TEXT,
  tem_dominio     TEXT,
  tem_pixel_meta  TEXT,
  plataforma      TEXT,
  msg_enviada     TEXT,
  data_disparo    TIMESTAMPTZ,
  zapi_status     TEXT
);

CREATE INDEX leads_client_status ON leads (client_id, status);
CREATE INDEX leads_client_data   ON leads (client_id, data_captacao DESC);

-- Histórico de execuções
CREATE TABLE executions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID REFERENCES clients NOT NULL,
  started_at       TIMESTAMPTZ DEFAULT now(),
  niche            TEXT,
  cidade           TEXT,
  captados         INT DEFAULT 0,
  pre_qualificados INT DEFAULT 0,
  qualificados     INT DEFAULT 0,
  disparados       INT DEFAULT 0
);

CREATE INDEX executions_client ON executions (client_id, started_at DESC);

-- ================================================================
-- Row Level Security (cada user vê só seus dados)
-- ================================================================

ALTER TABLE clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions      ENABLE ROW LEVEL SECURITY;

-- clients: user vê/edita apenas o seu
CREATE POLICY "own client" ON clients
  USING (user_id = auth.uid());

-- client_settings: via client_id do user
CREATE POLICY "own settings" ON client_settings
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "own settings update" ON client_settings
  FOR UPDATE USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- leads: via client_id do user
CREATE POLICY "own leads" ON leads
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "own leads insert" ON leads
  FOR INSERT WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "own leads update" ON leads
  FOR UPDATE USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- executions: via client_id do user
CREATE POLICY "own executions" ON executions
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "own executions insert" ON executions
  FOR INSERT WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- ================================================================
-- Service Role bypassa RLS (usado pelo bot Python)
-- Não precisa de policy — service_role key ignora RLS por padrão
-- ================================================================

-- ================================================================
-- Trigger: atualiza updated_at em client_settings
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_settings_updated_at
  BEFORE UPDATE ON client_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
