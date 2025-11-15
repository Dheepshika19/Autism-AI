import Dexie, { Table } from 'dexie'

export interface ChildProfile {
  id?: number
  name: string
  birthDate?: string
  notes?: string
  createdAt: number
}

export interface StaffProfile {
  id?: number
  name: string
  role?: string
  createdAt: number
}

export interface TimetableEntry {
  id?: number
  childId: number
  date: string // YYYY-MM-DD
  activity: string
  start: string // HH:MM
  end: string   // HH:MM
  staffId?: number
  createdAt: number
}

export interface ActivityTemplate {
  id?: number
  title: string
  description?: string
  durationMins: number
  createdAt: number
}

export interface StaffAllocation {
  id?: number
  childId: number
  staffId: number
  date: string // YYYY-MM-DD
  start: string // HH:MM
  end: string   // HH:MM
  createdAt: number
  conflict?: boolean
}

export interface ProgressLog {
  id?: number
  childId: number
  date: string // YYYY-MM-DD
  completed: boolean
  engagement: number // 0-10
  notes?: string
  createdAt: number
}

export class AutismAIDB extends Dexie {
  children!: Table<ChildProfile, number>
  staff!: Table<StaffProfile, number>
  timetable!: Table<TimetableEntry, number>
  activityTemplates!: Table<ActivityTemplate, number>
  staffAllocation!: Table<StaffAllocation, number>
  progressLogs!: Table<ProgressLog, number>

  constructor() {
    super('autismAI')
    // v3: add start/end to timetable, plus previous v2 tables
    this.version(3).stores({
      children: '++id, name, birthDate, createdAt',
      staff: '++id, name, role, createdAt',
      timetable: '++id, childId, date, start, end, staffId, createdAt',
      activityTemplates: '++id, title, durationMins, createdAt',
      staffAllocation: '++id, childId, staffId, date, start, end, createdAt',
      progressLogs: '++id, childId, date, completed, engagement, createdAt',
    })
  }
}

export const db = new AutismAIDB()
