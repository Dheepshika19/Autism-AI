import { useEffect, useMemo, useState } from 'react'
import { db, StaffProfile, ChildProfile, TimetableEntry, StaffAllocation } from '../db/dexie'
import { greedyAllocate } from '../utils/staffAllocator'
import { apiMicroCoach } from '../utils/api'

export default function StaffAllocator() {
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [name, setName] = useState('')
  const [role, setRole] = useState('Therapist')
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [whyText, setWhyText] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const [s, c] = await Promise.all([
        db.staff.orderBy('createdAt').toArray(),
        db.children.orderBy('createdAt').toArray(),
      ])
      setStaff(s)
      setChildren(c)
    }
    load()
  }, [])

  useEffect(() => {
    const loadTt = async () => {
      const tt = await db.timetable.where('date').equals(date).toArray()
      setTimetable(tt)
    }
    loadTt()
  }, [date])

  const blocks = useMemo(() => timetable.map(t => ({ childId: t.childId, date: t.date, start: t.start, end: t.end })), [timetable])

  const addStaff = async () => {
    if (!name.trim()) return
    await db.staff.add({ name: name.trim(), role: role.trim(), createdAt: Date.now() })
    setName('')
    setStaff(await db.staff.orderBy('createdAt').toArray())
  }

  const autoAssign = async () => {
    const staffSlim = staff.map(s => ({ id: s.id!, name: s.name }))
    const alloc = greedyAllocate(staffSlim, blocks)
    const rows: StaffAllocation[] = alloc.map(a => ({ ...a, createdAt: Date.now() }))
    await db.staffAllocation.bulkAdd(rows)
    alert('Assigned staff to blocks. Conflicts are flagged in red below.')
  }

  const whyMapping = async () => {
    const context = {
      date,
      staff: staff.map(s => ({ id: s.id, name: s.name })),
      blocks,
    }
    const res = await apiMicroCoach({ context })
    if (res.ok) setWhyText(res.data.text)
    else setWhyText('Could not fetch explanation (offline or server error).')
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Staff Allocator</h2>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="p-4 border rounded bg-slate-50">
          <h3 className="font-medium mb-2">Add Staff</h3>
          <div className="flex gap-2 mb-2">
            <input className="border rounded px-2 py-1 flex-1" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="border rounded px-2 py-1" placeholder="Role" value={role} onChange={e=>setRole(e.target.value)} />
            <button className="px-2 py-1 border rounded bg-white" onClick={addStaff}>Add</button>
          </div>
          <ul className="text-sm list-disc pl-4 space-y-1 max-h-40 overflow-auto">
            {staff.map(s => <li key={s.id}>{s.name} — {s.role}</li>)}
          </ul>
        </div>

        <div className="p-4 border rounded bg-slate-50">
          <h3 className="font-medium mb-2">Children</h3>
          <ul className="text-sm list-disc pl-4 space-y-1 max-h-40 overflow-auto">
            {children.map(c => <li key={c.id}>{c.name}</li>)}
          </ul>
        </div>

        <div className="p-4 border rounded bg-slate-50">
          <h3 className="font-medium mb-2">Date</h3>
          <input type="date" className="border rounded px-2 py-1" value={date} onChange={e=>setDate(e.target.value)} />
          <div className="mt-3">
            <button className="px-2 py-1 border rounded bg-white" onClick={autoAssign}>Auto-Assign</button>
            <button className="ml-2 px-2 py-1 border rounded bg-slate-50" onClick={whyMapping}>Why this mapping?</button>
          </div>
        </div>
      </section>

      <section className="p-4 border rounded">
        <h3 className="font-medium mb-2">Assignments (for selected date)</h3>
        <AssignmentList date={date} />
        {whyText && (
          <div className="mt-3 p-3 rounded border bg-slate-50 whitespace-pre-wrap text-sm text-slate-800">{whyText}</div>
        )}
      </section>
    </div>
  )
}

function AssignmentList({ date }: { date: string }) {
  const [rows, setRows] = useState<(StaffAllocation & { childName?: string; staffName?: string })[]>([])
  useEffect(() => {
    const load = async () => {
      const [alloc, staff, children] = await Promise.all([
        db.staffAllocation.where('date').equals(date).toArray(),
        db.staff.toArray(),
        db.children.toArray(),
      ])
      const sMap = Object.fromEntries(staff.map(s => [s.id!, s.name]))
      const cMap = Object.fromEntries(children.map(c => [c.id!, c.name]))
      setRows(alloc.map(a => ({...a, staffName: sMap[a.staffId], childName: cMap[a.childId]})))
    }
    load()
  }, [date])

  if (rows.length === 0) return <p className="text-sm text-slate-600">No assignments yet.</p>
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {rows.map(r => (
        <div key={r.id} className={`p-3 rounded border ${r.conflict ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
          <div className="text-sm text-slate-500">{r.date} {r.start}-{r.end}</div>
          <div className="font-medium">{r.childName || r.childId} — {r.staffName || r.staffId}</div>
          {r.conflict && <div className="text-xs text-red-600 mt-1">Conflict: double-booked</div>}
        </div>
      ))}
    </div>
  )
}
