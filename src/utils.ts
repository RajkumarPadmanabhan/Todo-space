import type { MonthCategory, Task, Wallpaper } from './types'

const DAY = 24 * 60 * 60 * 1000
const HOUR = 60 * 60 * 1000
const MIN = 60 * 1000

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function dateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(d: Date, days: number) {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  next.setDate(next.getDate() + days)
  return next
}

export function startOfWeek(d: Date) {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = next.getDay()
  const diff = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + diff)
  return next
}

export function addMonths(d: Date, count: number) {
  return new Date(d.getFullYear(), d.getMonth() + count, 1)
}

export function sameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b)
}

export function taskDue(task: { date: string; time: string }) {
  const [y, m, day] = task.date.split('-').map(Number)
  const [hh, mm] = task.time.split(':').map(Number)
  return new Date(y, (m || 1) - 1, day || 1, hh || 0, mm || 0, 0, 0)
}

export function isWithin24h(due: Date, now: Date) {
  const diff = due.getTime() - now.getTime()
  return diff > 0 && diff <= DAY
}

export function countdownLabel(due: Date, now: Date) {
  const diff = due.getTime() - now.getTime()
  const abs = Math.abs(diff)
  const days = Math.floor(abs / DAY)
  const hrs = Math.floor(abs / HOUR)
  const mins = Math.floor(abs / MIN)
  const dayWord = days === 1 ? 'day' : 'days'
  const tail = diff >= 0 ? 'left' : 'overdue'
  if (hrs < 1) return `0 days ${tail} and 0hrs ${tail} · ${mins}min ${tail}`
  return `${days} ${dayWord} ${tail} and ${hrs}hrs ${tail}`
}

export function taskCountdown(task: Pick<Task, 'date' | 'time' | 'done'>, now: Date) {
  if (task.done) return 'Completed'
  return countdownLabel(taskDue(task), now)
}

export function alertKey(task: { id: string; date: string; time: string }) {
  return `${task.id}|${task.date}|${task.time}`
}

export function compareTasks(a: Pick<Task, 'date' | 'time' | 'createdAt'>, b: Pick<Task, 'date' | 'time' | 'createdAt'>) {
  const delta = taskDue(a).getTime() - taskDue(b).getTime()
  if (delta !== 0) return delta
  return a.createdAt - b.createdAt
}

export function matchesQuery(task: Pick<Task, 'title' | 'note'>, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return task.title.toLowerCase().includes(q) || task.note.toLowerCase().includes(q)
}

export function formatTaskTime(time: string) {
  const [hh, mm] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(hh || 0, mm || 0, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatPrettyDate(date: string) {
  const due = taskDue({ date, time: '12:00' })
  return due.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatClock(now: Date) {
  const date = now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })
  return `${date} · ${time}`
}

export function formatRange(start: Date, end: Date) {
  const year = end.getFullYear()
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    const month = start.toLocaleDateString(undefined, { month: 'short' })
    return `${month} ${start.getDate()} – ${end.getDate()}, ${year}`
  }
  const left = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const right = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${left} – ${right}, ${year}`
}

export function formatMonth(anchor: Date) {
  return anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function formatRelative(ts: number, now: Date) {
  const seconds = Math.max(0, Math.floor((now.getTime() - ts) / 1000))
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function defaultTime(now: Date) {
  const hour = (now.getHours() + 1) % 24
  return `${String(hour).padStart(2, '0')}:00`
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
  return letters || 'T'
}

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function monthMatrix(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = startOfWeek(first)
  const weeks: Date[][] = []
  for (let w = 0; w < 6; w += 1) {
    const row: Date[] = []
    for (let d = 0; d < 7; d += 1) row.push(addDays(start, w * 7 + d))
    weeks.push(row)
  }
  const last = weeks[5]
  if (last && last.every((day) => day.getMonth() !== anchor.getMonth())) weeks.pop()
  return weeks
}

export async function hashPassword(email: string, password: string) {
  const data = new TextEncoder().encode(`${email.toLowerCase()}::${password}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function notifyDesktop(title: string, body: string, tag: string) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return false
    new Notification(title, {
      body,
      tag,
      icon: `${location.origin}/favicon.svg`,
    })
    return true
  } catch {
    return false
  }
}

export async function requestDesktopPermission() {
  if (!('Notification' in window)) return 'unsupported' as const
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied' as const
  }
}

export function monthKey(date: string) {
  return date.slice(0, 7)
}

export function monthTitle(date: string) {
  const due = taskDue({ date: `${monthKey(date)}-01`, time: '12:00' })
  return due.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

export function monthCategory(
  task: { date: string; time: string; done: boolean; deletedAt?: number | null },
  now: Date,
): MonthCategory {
  if (task.deletedAt) return 'deleted'
  if (task.done || taskDue(task).getTime() <= now.getTime()) return 'past'
  return 'upcoming'
}

export function defaultWallpaper(): Wallpaper {
  return { image: '', blur: 0, saturation: 100, brightness: 100, dim: 28 }
}

function clampNum(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export function clampWallpaper(input: Partial<Wallpaper> | null | undefined): Wallpaper {
  const base = defaultWallpaper()
  if (!input) return base
  const image = typeof input.image === 'string' && input.image.startsWith('data:image/') ? input.image : ''
  return {
    image,
    blur: clampNum(input.blur, 0, 30, base.blur),
    saturation: clampNum(input.saturation, 100, 220, base.saturation),
    brightness: clampNum(input.brightness, 70, 140, base.brightness),
    dim: clampNum(input.dim, 0, 80, base.dim),
  }
}

export function wallpaperFilter(wall: Wallpaper) {
  return `blur(${wall.blur}px) saturate(${wall.saturation}%) brightness(${wall.brightness}%)`
}

export function readImageFile(file: File, maxEdge: number, quality: number) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const ctx = canvas.getContext('2d')
      URL.revokeObjectURL(url)
      if (!ctx) {
        reject(new Error('Could not read that image.'))
        return
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    image.src = url
  })
}

export function groupLabel(date: string, now: Date) {
  const today = dateKey(now)
  const tomorrow = dateKey(addDays(now, 1))
  if (date === today) return 'Today'
  if (date === tomorrow) return 'Tomorrow'
  if (date < today) return `Overdue · ${formatPrettyDate(date)}`
  return formatPrettyDate(date)
}
