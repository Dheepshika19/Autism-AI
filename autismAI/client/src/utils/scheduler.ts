// Simple greedy scheduler: fills a child's day with activity templates in order until the time window is filled.
// This is intentionally local-only. No network/AI used.

export interface TimeWindow {
  start: string // HH:MM
  end: string   // HH:MM
}

export interface ActivityTemplateInput {
  id: number
  title: string
  durationMins: number
}

export interface GeneratedBlock {
  start: string
  end: string
  activity: string
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function greedySchedule(window: TimeWindow, templates: ActivityTemplateInput[]): GeneratedBlock[] {
  const out: GeneratedBlock[] = []
  let cur = toMinutes(window.start)
  const end = toMinutes(window.end)
  if (cur >= end || templates.length === 0) return out

  let i = 0
  while (cur < end) {
    const tpl = templates[i % templates.length]
    const next = cur + tpl.durationMins
    if (next > end) break
    out.push({ start: toHHMM(cur), end: toHHMM(next), activity: tpl.title })
    cur = next
    i++
    if (i > 1000) break // safety
  }
  return out
}
