import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config()

const app = express()
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000

app.use(cors())
app.use(express.json())

app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', name: 'autismAI', time: new Date().toISOString() })
})

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

function safeText(v: unknown): string {
  if (typeof v === 'string') return v
  try { return JSON.stringify(v) } catch { return String(v) }
}

// POST /api/summarize
// Input: { childProfile, daySummary }
// Output: { text }
app.post('/api/summarize', async (req, res) => {
  const { childProfile, daySummary } = req.body || {}
  const client = getOpenAI()
  try {
    if (!client) {
      return res.json({
        text: `Today we focused on routine, engagement, and comfort. ${childProfile?.name ? childProfile.name + ' ' : ''}participated in activities with positive moments. We'll keep building on strengths tomorrow.`,
        offline: true,
      })
    }
    const prompt = `Create a parent-friendly daily summary for a child. Be concise, warm, and actionable.\nChild Profile: ${safeText(childProfile)}\nDay Summary: ${safeText(daySummary)}`
    const out = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a compassionate special-education assistant who writes clear, supportive, family-friendly summaries.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    })
    res.json({ text: out.choices[0]?.message?.content ?? 'Summary unavailable.' })
  } catch (err) {
    console.error('summarize error', err)
    res.status(500).json({ error: 'summarize_failed' })
  }
})

// POST /api/microcoach
// Input: { context }
// Output: { text }
app.post('/api/microcoach', async (req, res) => {
  const { context } = req.body || {}
  const client = getOpenAI()
  try {
    if (!client) {
      return res.json({ text: 'Try one clear instruction at a time and praise specific effort.', offline: true })
    }
    const prompt = `Provide 1–2 line teacher micro-coaching guidance based on context: ${safeText(context)}`
    const out = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You provide crisp, practical 1–2 line micro-coaching for teachers.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
    })
    res.json({ text: out.choices[0]?.message?.content ?? 'Guidance unavailable.' })
  } catch (err) {
    console.error('microcoach error', err)
    res.status(500).json({ error: 'microcoach_failed' })
  }
})

// POST /api/activity
// Input: { constraints }
// Output: { activity: { title, steps[], materials[] } }
app.post('/api/activity', async (req, res) => {
  const { constraints } = req.body || {}
  const client = getOpenAI()
  try {
    if (!client) {
      return res.json({
        activity: {
          title: 'Picture Matching',
          steps: ['Lay out 4 picture cards', 'Ask child to find matches', 'Celebrate each match'],
          materials: ['Picture cards'],
        }, offline: true
      })
    }
    const prompt = `Generate a short JSON for a quick activity suitable for autistic children. Include title, steps (3-5), materials. Constraints: ${safeText(constraints)}. Reply ONLY with JSON.`
    const out = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Return strict JSON only, no extra text.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
    })
    const content = out.choices[0]?.message?.content ?? '{}'
    let parsed: any
    try { parsed = JSON.parse(content) } catch { parsed = { activity: { title: 'Quick Activity', steps: [], materials: [] } } }
    res.json(parsed)
  } catch (err) {
    console.error('activity error', err)
    res.status(500).json({ error: 'activity_failed' })
  }
})

// POST /api/timetable/rationale
// Input: { entries, childProfile }
// Output: { text }
app.post('/api/timetable/rationale', async (req, res) => {
  const { entries, childProfile } = req.body || {}
  const client = getOpenAI()
  try {
    if (!client) {
      return res.json({ text: 'We prioritized predictable routines, alternating focus with movement, and aligning activities with peak engagement times.', offline: true })
    }
    const prompt = `Explain three short reasons for the schedule placements given the child profile. Keep it supportive and concrete.\nChild: ${safeText(childProfile)}\nEntries: ${safeText(entries)}`
    const out = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Provide 3 concise, supportive reasons for the schedule.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    })
    res.json({ text: out.choices[0]?.message?.content ?? 'Rationale unavailable.' })
  } catch (err) {
    console.error('timetable rationale error', err)
    res.status(500).json({ error: 'timetable_rationale_failed' })
  }
})

// POST /api/weekly
// Input: { logs, audience }
// Output: { text }
app.post('/api/weekly', async (req, res) => {
  const { logs, audience } = req.body || {}
  const client = getOpenAI()
  try {
    if (!client) {
      return res.json({ text: 'Observations: steady engagement, improved routine, positive response to visuals. Next steps: maintain routines, expand choices, short movement breaks.', offline: true })
    }
    const prompt = `Create 3 observations and 3 next steps tailored for ${audience || 'Teacher/Parent/Doctor'}. Keep it concise and professional. Logs: ${safeText(logs)}`
    const out = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You produce brief weekly insights and next steps for multiple audiences.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
    })
    res.json({ text: out.choices[0]?.message?.content ?? 'Weekly insights unavailable.' })
  } catch (err) {
    console.error('weekly error', err)
    res.status(500).json({ error: 'weekly_failed' })
  }
})

// POST /api/anon
// Input: { logs }
// Output: { logs: anonymized[] }
app.post('/api/anon', async (req, res) => {
  const { logs } = req.body || {}
  const client = getOpenAI()
  try {
    if (!client) {
      // Simple local anonymization fallback
      const anon = Array.isArray(logs) ? logs.map((l) => ({ ...l, childId: 'anon', notes: l?.notes ? '[redacted]' : undefined })) : []
      return res.json({ logs: anon, offline: true })
    }
    const prompt = `Anonymize logs by removing any identifying information while keeping metrics. Return JSON logs only. Logs: ${safeText(logs)}`
    const out = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Return strictly JSON with anonymized logs array under key "logs".' },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
    })
    const content = out.choices[0]?.message?.content ?? '{}'
    let parsed: any
    try { parsed = JSON.parse(content) } catch { parsed = { logs: [] } }
    res.json(parsed)
  } catch (err) {
    console.error('anon error', err)
    res.status(500).json({ error: 'anon_failed' })
  }
})

app.listen(PORT, () => {
  console.log(`[server] autismAI listening on http://localhost:${PORT}`)
})
