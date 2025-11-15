// Simple greedy staff allocator.
// Assigns available staff to child time blocks by earliest start time. Conflicts are flagged if a staff is double-booked.

export interface TimeBlock { childId: number; date: string; start: string; end: string }
export interface Staff { id: number; name: string }

export interface Allocation { childId: number; staffId: number; date: string; start: string; end: string; conflict?: boolean }

function toMinutes(hhmm: string): number { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const aS = toMinutes(aStart), aE = toMinutes(aEnd), bS = toMinutes(bStart), bE = toMinutes(bEnd)
  return Math.max(aS, bS) < Math.min(aE, bE)
}

export function greedyAllocate(staff: Staff[], blocks: TimeBlock[]): Allocation[] {
  const out: Allocation[] = []
  const byStaff: Record<number, Allocation[]> = {}
  const sorted = [...blocks].sort((a,b) => (a.date.localeCompare(b.date) || toMinutes(a.start) - toMinutes(b.start)))

  for (const b of sorted) {
    let chosen: number | null = null
    for (const s of staff) {
      const allocs = byStaff[s.id] || []
      const conflict = allocs.some(a => a.date === b.date && overlaps(a.start, a.end, b.start, b.end))
      if (!conflict) { chosen = s.id; break }
    }
    if (chosen == null && staff.length > 0) {
      // pick first but mark conflict
      chosen = staff[0].id
      const alloc: Allocation = { childId: b.childId, staffId: chosen, date: b.date, start: b.start, end: b.end, conflict: true }
      byStaff[chosen] = [...(byStaff[chosen]||[]), alloc]
      out.push(alloc)
    } else if (chosen != null) {
      const alloc: Allocation = { childId: b.childId, staffId: chosen, date: b.date, start: b.start, end: b.end }
      byStaff[chosen] = [...(byStaff[chosen]||[]), alloc]
      out.push(alloc)
    }
  }
  return out
}
