"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, Plus, Save, Loader2 } from "lucide-react"
import type { ClientSettings } from "@/lib/types"

export function ConfigForm({ settings, clientId }: { settings: ClientSettings; clientId: string }) {
  const supabase = createClient()

  const [niches, setNiches]           = useState<string[]>(settings.niches ?? [])
  const [cities, setCities]           = useState<string[]>(settings.cities ?? [])
  const [metaDispatch, setMetaDispatch] = useState(settings.meta_dispatch)
  const [delay, setDelay]             = useState(settings.dispatch_delay)
  const [maxDispatch, setMaxDispatch] = useState(settings.max_dispatch)
  const [msgTemplate, setMsgTemplate] = useState(settings.msg_template ?? "")
  const [newNiche, setNewNiche]       = useState("")
  const [newCity, setNewCity]         = useState("")
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)

  function addNiche() {
    if (newNiche.trim() && !niches.includes(newNiche.trim())) {
      setNiches([...niches, newNiche.trim()])
      setNewNiche("")
    }
  }

  function addCity() {
    if (newCity.trim() && !cities.includes(newCity.trim())) {
      setCities([...cities, newCity.trim()])
      setNewCity("")
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    const { error } = await supabase
      .from("client_settings")
      .update({
        niches,
        cities,
        meta_dispatch:   metaDispatch,
        dispatch_delay:  delay,
        max_dispatch:    maxDispatch,
        msg_template:    msgTemplate,
      })
      .eq("client_id", clientId)

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="space-y-8">
      {/* Nichos */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Nichos de busca</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {niches.map(n => (
            <span key={n} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
              {n}
              <button onClick={() => setNiches(niches.filter(x => x !== n))} className="hover:text-blue-900">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newNiche}
            onChange={e => setNewNiche(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addNiche()}
            placeholder="ex: moda plus size"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={addNiche} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Plus size={14} /> Adicionar
          </button>
        </div>
      </section>

      {/* Cidades */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Cidades</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {cities.map(c => (
            <span key={c} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full">
              {c}
              <button onClick={() => setCities(cities.filter(x => x !== c))} className="hover:text-purple-900">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newCity}
            onChange={e => setNewCity(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCity()}
            placeholder="ex: Curitiba"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={addCity} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Plus size={14} /> Adicionar
          </button>
        </div>
      </section>

      {/* Parâmetros numéricos */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Parâmetros do pipeline</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meta de qualificados/dia</label>
            <input
              type="number" min={1} max={50}
              value={metaDispatch}
              onChange={e => setMetaDispatch(parseInt(e.target.value))}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Delay entre disparos (seg)</label>
            <input
              type="number" min={30} max={300}
              value={delay}
              onChange={e => setDelay(parseInt(e.target.value))}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Máx. disparos por run</label>
            <input
              type="number" min={1} max={50}
              value={maxDispatch}
              onChange={e => setMaxDispatch(parseInt(e.target.value))}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* Template de mensagem */}
      <section>
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Template da mensagem</h2>
        <p className="text-xs text-gray-500 mb-3">
          Separe partes com <code className="bg-gray-100 px-1 rounded">---</code>. Variáveis: <code className="bg-gray-100 px-1 rounded">{"{nome}"}</code>, <code className="bg-gray-100 px-1 rounded">{"{segmento}"}</code>
        </p>
        <textarea
          value={msgTemplate}
          onChange={e => setMsgTemplate(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
      </section>

      {/* Salvar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Salvo com sucesso!</span>}
      </div>
    </div>
  )
}
