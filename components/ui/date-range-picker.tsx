'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtLong } from '@/lib/date-utils'

// ─── Presets ────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Hoje',            value: 'today' },
  { label: 'Ontem',           value: 'yesterday' },
  { label: 'Hoje e ontem',    value: 'today_yesterday' },
  { label: 'Últimos 7 dias',  value: 'last_7d' },
  { label: 'Últimos 14 dias', value: 'last_14d' },
  { label: 'Últimos 28 dias', value: 'last_28d' },
  { label: 'Últimos 30 dias', value: 'last_30d' },
  { label: 'Esta semana',     value: 'this_week' },
  { label: 'Semana passada',  value: 'last_week' },
  { label: 'Este mês',        value: 'this_month' },
  { label: 'Mês passado',     value: 'last_month' },
]

// ─── Date helpers ────────────────────────────────────────────────────────────

function toISO(d: Date) { return d.toISOString().split('T')[0] }

function presetToRange(preset: string): { from: Date; to: Date } {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  switch (preset) {
    case 'today':           return { from: today, to: today }
    case 'yesterday':       return { from: yesterday, to: yesterday }
    case 'today_yesterday': return { from: yesterday, to: today }
    case 'last_7d':  { const f = new Date(yesterday); f.setDate(yesterday.getDate() - 6);  return { from: f, to: yesterday } }
    case 'last_14d': { const f = new Date(yesterday); f.setDate(yesterday.getDate() - 13); return { from: f, to: yesterday } }
    case 'last_28d': { const f = new Date(yesterday); f.setDate(yesterday.getDate() - 27); return { from: f, to: yesterday } }
    case 'last_30d': { const f = new Date(yesterday); f.setDate(yesterday.getDate() - 29); return { from: f, to: yesterday } }
    case 'this_week': { const f = new Date(today); f.setDate(today.getDate() - today.getDay() + 1); return { from: f, to: today } }
    case 'last_week': { const f = new Date(today); f.setDate(today.getDate() - today.getDay() - 6); const t = new Date(f); t.setDate(f.getDate() + 6); return { from: f, to: t } }
    case 'this_month': { return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today } }
    case 'last_month': { return { from: new Date(today.getFullYear(), today.getMonth() - 1, 1), to: new Date(today.getFullYear(), today.getMonth(), 0) } }
    default: { const f = new Date(yesterday); f.setDate(yesterday.getDate() - 29); return { from: f, to: yesterday } }
  }
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// ─── Mini Calendar ───────────────────────────────────────────────────────────

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAY_NAMES   = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

function MiniCalendar({ month, year, from, to, hoverDate, onSelectDay, onHoverDay }: {
  month: number; year: number
  from: Date | null; to: Date | null; hoverDate: Date | null
  onSelectDay: (d: Date) => void; onHoverDay: (d: Date | null) => void
}) {
  const firstDay    = new Date(year, month, 1)
  const startDow    = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  const effectiveTo = to || hoverDate
  const today = new Date(); today.setHours(0, 0, 0, 0)

  return (
    <div className="w-56">
      <p className="text-center text-sm font-semibold text-gray-800 mb-3">{MONTH_NAMES[month]} {year}</p>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const isFrom  = from && isSameDay(d, from)
          const isTo    = effectiveTo && isSameDay(d, effectiveTo)
          const inRange = from && effectiveTo && d > from && d < effectiveTo
          const isToday = isSameDay(d, today)
          return (
            <div
              key={i}
              onClick={() => onSelectDay(d)}
              onMouseEnter={() => onHoverDay(d)}
              onMouseLeave={() => onHoverDay(null)}
              className={cn(
                'h-8 flex items-center justify-center text-xs cursor-pointer select-none transition-colors',
                isFrom || isTo ? 'bg-blue-600 text-white rounded-full font-semibold'
                : inRange      ? 'bg-blue-50 text-blue-700'
                               : 'text-gray-700 hover:bg-gray-100 rounded-full',
                isToday && !isFrom && !isTo && 'font-bold text-blue-600'
              )}
            >{d.getDate()}</div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface DateRangePickerProps { defaultPreset?: string }

export function DateRangePicker({ defaultPreset = 'last_30d' }: DateRangePickerProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const urlPreset = searchParams.get('preset') || defaultPreset
  const urlFrom   = searchParams.get('from') || undefined
  const urlTo     = searchParams.get('to')   || undefined

  const initialRange = urlFrom && urlTo
    ? { from: new Date(urlFrom + 'T00:00:00'), to: new Date(urlTo + 'T00:00:00') }
    : presetToRange(urlPreset)

  const [open, setOpen]                   = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(urlFrom && urlTo ? null : urlPreset)
  const [from, setFrom] = useState<Date | null>(initialRange.from)
  const [to, setTo]     = useState<Date | null>(initialRange.to)
  const [selecting, setSelecting]   = useState<'from' | 'to' | null>(null)
  const [hoverDate, setHoverDate]   = useState<Date | null>(null)

  const today = new Date()
  const [leftMonth,  setLeftMonth]  = useState(today.getMonth() === 0 ? 11 : today.getMonth() - 1)
  const [leftYear,   setLeftYear]   = useState(today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear())
  const [rightMonth, setRightMonth] = useState(today.getMonth())
  const [rightYear,  setRightYear]  = useState(today.getFullYear())

  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const triggerRef  = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
  }, [open])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  function handlePresetClick(preset: string) {
    const r = presetToRange(preset)
    setSelectedPreset(preset)
    setFrom(r.from); setTo(r.to)
    setSelecting(null)
  }

  function handleDaySelect(d: Date) {
    if (!selecting || selecting === 'from') {
      setFrom(d); setTo(null); setSelecting('to'); setSelectedPreset(null)
    } else {
      if (from && d < from) { setTo(from); setFrom(d) }
      else setTo(d)
      setSelecting(null)
    }
  }

  function handlePrev() {
    if (leftMonth  === 0) { setLeftMonth(11);  setLeftYear(y  => y - 1) } else setLeftMonth(m  => m - 1)
    if (rightMonth === 0) { setRightMonth(11); setRightYear(y => y - 1) } else setRightMonth(m => m - 1)
  }
  function handleNext() {
    if (leftMonth  === 11) { setLeftMonth(0);  setLeftYear(y  => y + 1) } else setLeftMonth(m  => m + 1)
    if (rightMonth === 11) { setRightMonth(0); setRightYear(y => y + 1) } else setRightMonth(m => m + 1)
  }

  function handleApply() {
    if (!from || !to) return
    const params = new URLSearchParams(searchParams.toString())
    if (selectedPreset) {
      params.set('preset', selectedPreset); params.delete('from'); params.delete('to')
    } else {
      params.set('from', toISO(from)); params.set('to', toISO(to)); params.delete('preset')
    }
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  const mainLabel = (() => {
    if (selectedPreset && from && to) {
      const name = PRESETS.find(p => p.value === selectedPreset)?.label ?? selectedPreset
      const noDate = ['today', 'yesterday', 'today_yesterday'].includes(selectedPreset)
      return noDate ? name : `${name}: ${fmtDate(from)} a ${fmtDate(to)}`
    }
    if (from && to) return `${fmtDate(from)} a ${fmtDate(to)}`
    return 'Selecionar período'
  })()

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => { setOpen(o => !o); if (!open) setSelecting('from') }}
        className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:border-gray-300 transition-all"
      >
        <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span>{mainLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right }}
          className="bg-white border border-gray-200 rounded-2xl shadow-xl z-[9999] flex overflow-hidden"
        >
          {/* Presets */}
          <div className="w-44 border-r border-gray-100 py-3 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Períodos</p>
            {PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => handlePresetClick(p.value)}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm transition-colors',
                  selectedPreset === p.value
                    ? 'text-blue-600 font-semibold bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >{p.label}</button>
            ))}
          </div>

          {/* Calendars */}
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors self-start mt-6">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <MiniCalendar
                month={leftMonth} year={leftYear}
                from={from} to={to} hoverDate={selecting === 'to' ? hoverDate : null}
                onSelectDay={handleDaySelect} onHoverDay={setHoverDate}
              />
              <MiniCalendar
                month={rightMonth} year={rightYear}
                from={from} to={to} hoverDate={selecting === 'to' ? hoverDate : null}
                onSelectDay={handleDaySelect} onHoverDay={setHoverDate}
              />
              <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors self-start mt-6">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-xs text-gray-400">
                {from && to ? `${fmtLong(toISO(from))} – ${fmtLong(toISO(to))}` : selecting === 'to' ? 'Selecione a data final' : 'Selecione a data inicial'}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleApply}
                  disabled={!from || !to}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all disabled:opacity-40"
                >
                  Atualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
