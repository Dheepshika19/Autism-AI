import { useEffect, useMemo, useState } from 'react'
import { db, ChildProfile, ProgressLog } from '../db/dexie'
import { apiSummarize, apiMicroCoach, apiWeekly } from '../utils/api'

export default function ProgressDashboard() {
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | ''>('')
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [completed, setCompleted] = useState(false)
  const [engagement, setEngagement] = useState(5)
  const [notes, setNotes] = useState('')
  const [logs, setLogs] = useState<ProgressLog[]>([])
  const [parentSummary, setParentSummary] = useState('')
  const [microCoach, setMicroCoach] = useState('')
  const [weeklyInsights, setWeeklyInsights] = useState('')

  useEffect(() => {
    const load = async () => {
      setChildren(await db.children.orderBy('createdAt').toArray())
    }
    load()
  }, [])

  useEffect(() => { refreshLogs() }, [selectedChildId, date])

  const refreshLogs = async () => {
    if (!selectedChildId) { setLogs([]); return }
    const rows = await db.progressLogs.where('childId').equals(Number(selectedChildId)).toArray()
    setLogs(rows.filter(r => r.date === date))
  }

  const saveLog = async () => {
    if (!selectedChildId) { alert('Select a child'); return }
    await db.progressLogs.add({ childId: Number(selectedChildId), date, completed, engagement, notes, createdAt: Date.now() })
    setNotes('')
    await refreshLogs()
  }

  const doParentSummary = async () => {
    if (!selectedChildId) { alert('Select a child'); return }
    const child = children.find(c => c.id === Number(selectedChildId))
    const daySummary = { date, entries: logs }
    const res = await apiSummarize({ childProfile: child, daySummary })
    if (res.ok) setParentSummary(res.data.text)
  }

  const doMicroCoach = async () => {
    const context = { date, lastLog: logs[logs.length - 1] }
    const res = await apiMicroCoach({ context })
    if (res.ok) setMicroCoach(res.data.text)
  }

  const doWeekly = async () => {
    const audience = 'Teacher/Parent/Doctor'
    const recent = await db.progressLogs.where('childId').equals(Number(selectedChildId)).toArray()
    const res = await apiWeekly({ logs: recent.slice(-20), audience })
    if (res.ok) setWeeklyInsights(res.data.text)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Progress Dashboard</h2>
      <section className="grid md:grid-cols-3 gap-4">
        <div className="p-4 border rounded bg-slate-50">
          <h3 className="font-medium mb-2">Child & Date</h3>
          <select className="border rounded px-2 py-1 w-full mb-2" value={selectedChildId} onChange={e=>setSelectedChildId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Select child...</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" className="border rounded px-2 py-1 w-full" value={date} onChange={e=>setDate(e.target.value)} />
        </div>

        <div className="p-4 border rounded bg-slate-50">
          <h3 className="font-medium mb-2">Log Entry</h3>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm">Completed</label>
            <input type="checkbox" checked={completed} onChange={e=>setCompleted(e.target.checked)} />
          </div>
          <label className="text-sm">Engagement: {engagement}</label>
          <input type="range" min={0} max={10} value={engagement} onChange={e=>setEngagement(Number(e.target.value))} className="w-full" />
          <textarea className="border rounded px-2 py-1 w-full mt-2" rows={4} placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
          <div className="mt-2"><button className="px-2 py-1 border rounded bg-white" onClick={saveLog}>Save</button></div>
        </div>

        <div className="p-4 border rounded bg-slate-50">
          <h3 className="font-medium mb-2">Logs (Selected Day)</h3>
          {logs.length === 0 && <p className="text-sm text-slate-600">No logs yet.</p>}
          <ul className="text-sm space-y-2 max-h-48 overflow-auto">
            {logs.map(l => (
              <li key={l.id} className="p-2 rounded border bg-white">
                <div className="text-slate-500 text-xs">{l.date}</div>
                <div>Completed: {l.completed ? 'Yes' : 'No'}; Engagement: {l.engagement}</div>
                {l.notes && <div className="text-slate-700 text-sm mt-1">{l.notes}</div>}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2 flex-wrap">
            <button className="px-2 py-1 border rounded bg-white" onClick={doParentSummary}>Generate Parent Summary</button>
            <button className="px-2 py-1 border rounded bg-slate-50" onClick={doMicroCoach}>Teacher Micro-Coach</button>
            <button className="px-2 py-1 border rounded bg-sky-50" onClick={doWeekly}>Weekly Insights</button>
          </div>
          {parentSummary && (
            <div className="mt-3 p-3 rounded border bg-slate-50 whitespace-pre-wrap text-sm text-slate-800">{parentSummary}</div>
          )}
          {microCoach && (
            <div className="mt-3 p-3 rounded border bg-slate-50 whitespace-pre-wrap text-sm text-slate-800">{microCoach}</div>
          )}
          {weeklyInsights && (
            <div className="mt-3 p-3 rounded border bg-slate-50 whitespace-pre-wrap text-sm text-slate-800">{weeklyInsights}</div>
          )}
        </div>
      </section>
    </div>
  )
}
