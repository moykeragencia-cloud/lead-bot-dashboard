const fmt = (d: Date) => d.toISOString().split('T')[0]

export function getEffectiveDateRange(
  preset: string,
  customFrom?: string,
  customTo?: string,
): { since: string; until: string } {
  if (customFrom && customTo) return { since: customFrom, until: customTo }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  switch (preset) {
    case 'today': return { since: fmt(today), until: fmt(today) }
    case 'yesterday': return { since: fmt(yesterday), until: fmt(yesterday) }
    case 'today_yesterday': return { since: fmt(yesterday), until: fmt(today) }
    case 'last_7d':  { const f = new Date(yesterday); f.setDate(yesterday.getDate() - 6);  return { since: fmt(f), until: fmt(yesterday) } }
    case 'last_14d': { const f = new Date(yesterday); f.setDate(yesterday.getDate() - 13); return { since: fmt(f), until: fmt(yesterday) } }
    case 'last_28d': { const f = new Date(yesterday); f.setDate(yesterday.getDate() - 27); return { since: fmt(f), until: fmt(yesterday) } }
    case 'last_30d': { const f = new Date(yesterday); f.setDate(yesterday.getDate() - 29); return { since: fmt(f), until: fmt(yesterday) } }
    case 'this_week': { const f = new Date(today); f.setDate(today.getDate() - today.getDay() + 1); return { since: fmt(f), until: fmt(today) } }
    case 'last_week': { const f = new Date(today); f.setDate(today.getDate() - today.getDay() - 6); const t = new Date(today); t.setDate(today.getDate() - today.getDay()); return { since: fmt(f), until: fmt(t) } }
    case 'this_month': { const f = new Date(today.getFullYear(), today.getMonth(), 1); return { since: fmt(f), until: fmt(today) } }
    case 'last_month': { const f = new Date(today.getFullYear(), today.getMonth() - 1, 1); const t = new Date(today.getFullYear(), today.getMonth(), 0); return { since: fmt(f), until: fmt(t) } }
    default: { const f = new Date(today); f.setDate(today.getDate() - 29); return { since: fmt(f), until: fmt(today) } }
  }
}

/** "2026-04-01" → "01/04" (ou "01/04/25" se ano diferente do atual) */
export function fmtBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  const thisYear = new Date().getFullYear().toString()
  return y !== thisYear ? `${d}/${m}/${y.slice(2)}` : `${d}/${m}`
}

/** "2026-04-16" → "16 de abr. de 2026" */
export function fmtLong(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function rangeLabel(since: string, until: string): string {
  return `${fmtBR(since)} a ${fmtBR(until)}`
}
