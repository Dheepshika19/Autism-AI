import { useEffect, useMemo, useState } from 'react'
import { db, ChildProfile, ActivityTemplate, TimetableEntry } from '../db/dexie'
import { greedySchedule } from '../utils/scheduler'
import { apiTimetableRationale } from '../utils/api'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function TimetablePlanner() {
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [templates, setTemplates] = useState<ActivityTemplate[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | ''>('')
  const [date, setDate] = useState<string>(todayISO())
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState<number>(30)
  const [windowStart, setWindowStart] = useState('09:00')
  const [windowEnd, setWindowEnd] = useState('12:00')
  const [generated, setGenerated] = useState<{ start: string, end: string, activity: string }[]>([])
  const [rationale, setRationale] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const [c, t] = await Promise.all([
        db.children.orderBy('createdAt').toArray(),
        db.activityTemplates.orderBy('createdAt').toArray()
      ])
      setChildren(c)
      setTemplates(t)
    }
    load()
  }, [])

  const selectedChild = useMemo(() => children.find(c => c.id === selectedChildId), [children, selectedChildId])

  const addChild = async () => {
    const name = prompt('Child name?')?.trim()
    if (!name) return
    await db.children.add({ name, createdAt: Date.now() })
    setChildren(await db.children.orderBy('createdAt').toArray())
  }

  const addTemplate = async () => {
    if (!title || duration <= 0) return
    await db.activityTemplates.add({ title, durationMins: duration, createdAt: Date.now() })
    setTitle('')
    setDuration(30)
    setTemplates(await db.activityTemplates.orderBy('createdAt').toArray())
  }

  const generatePlan = () => {
    const blocks = greedySchedule({ start: windowStart, end: windowEnd }, templates.map(t => ({ id: t.id!, title: t.title, durationMins: t.durationMins })))
    setGenerated(blocks)
  }

  const savePlan = async () => {
    if (!selectedChild?.id) { alert('Select a child'); return }
    const entries: TimetableEntry[] = generated.map(g => ({
      childId: selectedChild.id!, date, activity: g.activity, start: g.start, end: g.end, createdAt: Date.now()
    }))
    await db.timetable.bulkAdd(entries)
    alert('Saved!')
  }

  const explainSchedule = async () => {
    if (!selectedChild?.id || generated.length === 0) { alert('Generate a plan first'); return }
    const payload = {
      childProfile: selectedChild,
      entries: generated.map(g => ({ date, start: g.start, end: g.end, activity: g.activity }))
    }
    const res = await apiTimetableRationale(payload)
    if (res.ok) setRationale(res.data.text)
    else setRationale('Could not generate rationale (offline or server error).')
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Timetable Planner</h2>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg bg-slate-50">
          <h3 className="font-medium mb-2">Children</h3>
          <div className="flex gap-2 items-center mb-2">
            <select className="border rounded px-2 py-1 flex-1" value={selectedChildId} onChange={e => setSelectedChildId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Select child...</option>
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="px-2 py-1 border rounded bg-white" onClick={addChild}>Add</button>
          </div>
          <label className="block text-sm text-slate-600">Date</label>
          <input type="date" className="border rounded px-2 py-1" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="p-4 border rounded-lg bg-slate-50">
          <h3 className="font-medium mb-2">Activity Templates</h3>
          <div className="flex gap-2 mb-2">
            <input placeholder="Title" className="border rounded px-2 py-1 flex-1" value={title} onChange={e => setTitle(e.target.value)} />
            <input type="number" min={5} step={5} className="border rounded px-2 py-1 w-24" value={duration} onChange={e => setDuration(Number(e.target.value))} />
            <button className="px-2 py-1 border rounded bg-white" onClick={addTemplate}>Add</button>
          </div>
          <ul className="text-sm list-disc pl-4 space-y-1 max-h-40 overflow-auto">
            {templates.map(t => <li key={t.id}>{t.title} — {t.durationMins} mins</li>)}
          </ul>
        </div>

        <div className="p-4 border rounded-lg bg-slate-50">
          <h3 className="font-medium mb-2">Time Window</h3>
          <div className="flex gap-2 items-center">
            <input type="time" className="border rounded px-2 py-1" value={windowStart} onChange={e => setWindowStart(e.target.value)} />
            <span>to</span>
            <input type="time" className="border rounded px-2 py-1" value={windowEnd} onChange={e => setWindowEnd(e.target.value)} />
            <button className="px-2 py-1 border rounded bg-white" onClick={generatePlan}>Generate</button>
          </div>
        </div>
      </section>

      <section className="p-4 border rounded-lg">
        <h3 className="font-medium mb-2">Generated Blocks</h3>
        {generated.length === 0 && <p className="text-sm text-slate-600">No blocks yet. Add templates and click Generate.</p>}
        <div className="grid md:grid-cols-2 gap-3">
          {generated.map((g, idx) => (
            <div key={idx} className="p-3 rounded border bg-white">
              <div className="text-sm text-slate-500">{g.start} - {g.end}</div>
              <div className="font-medium">{g.activity}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button className="px-3 py-2 border rounded bg-sky-50 hover:bg-sky-100" onClick={savePlan}>Save Plan</button>
          <button className="px-3 py-2 border rounded bg-white hover:bg-slate-50" onClick={explainSchedule}>Explain schedule</button>
        </div>
        {rationale && (
          <div className="mt-3 p-3 rounded border bg-slate-50 whitespace-pre-wrap text-sm text-slate-800">
            {rationale}
          </div>
        )}
      </section>
    </div>
  )
}
