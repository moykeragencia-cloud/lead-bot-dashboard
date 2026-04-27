-- ================================================================
-- Tabela de mensagens WhatsApp (entrada e saída)
-- ================================================================

CREATE TABLE messages (
  id            TEXT PRIMARY KEY,           -- messageId do Z-API
  client_id     UUID REFERENCES clients NOT NULL,
  lead_id       TEXT REFERENCES leads(id),  -- null se não encontrar o lead
  phone         TEXT NOT NULL,              -- número sem @c.us
  direction     TEXT NOT NULL,              -- 'in' | 'out'
  body          TEXT,                       -- texto da mensagem
  media_type    TEXT,                       -- 'text' | 'image' | 'audio' | 'document' | etc
  media_url     TEXT,                       -- URL da mídia se houver
  sender_name   TEXT,                       -- nome do contato (fromMe=false)
  received_at   TIMESTAMPTZ DEFAULT now(),
  raw           JSONB                       -- payload completo do Z-API
);

CREATE INDEX messages_lead    ON messages (lead_id, received_at DESC);
CREATE INDEX messages_phone   ON messages (phone, client_id);
CREATE INDEX messages_client  ON messages (client_id, received_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own messages" ON messages
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "own messages insert" ON messages
  FOR INSERT WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));
