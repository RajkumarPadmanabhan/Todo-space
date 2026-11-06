import { useCallback, useEffect, useRef, useState } from 'react'
import type { Task } from './types'
import { DUE_GRACE, alertSchedule } from './utils'

type Args = {
  userId: string | null
  tasks: Task[]
  sentToasts: string[]
  sentDesktop: string[]
  markToastSent: (keys: string[]) => void
  markDesktopSent: (keys: string[]) => void
}

/**
 * Hands the upcoming alert schedule to the local To-Dey server: every 10 seconds, and right away when a
 * note is added, edited or finished. While this window is open the server stays quiet; once it has not
 * heard from the app for half a minute it sends the system notifications itself.
 *
 * Keys the server already delivered come back and are marked as sent here, so reopening the window does
 * not repeat them, and keys this window showed go up so the server does not repeat those either.
 * Without the server (plain `vite` dev) this is a no-op.
 *
 * Returns true once the first sync has answered (or failed), so in-app alerts can wait for it.
 */
export function useAlertSync({ userId, tasks, sentToasts, sentDesktop, markToastSent, markDesktopSent }: Args) {
  const [ready, setReady] = useState(false)
  const latest = useRef({ tasks, sentToasts, sentDesktop, markToastSent, markDesktopSent })
  latest.current = { tasks, sentToasts, sentDesktop, markToastSent, markDesktopSent }
  const lastSchedule = useRef('')

  const sync = useCallback(async () => {
    const current = latest.current
    const floor = Date.now() - DUE_GRACE
    const alerts = current.tasks
      .filter((task) => !task.done)
      .flatMap(alertSchedule)
      .filter((alert) => alert.at > floor)
    const keys = new Set(alerts.map((alert) => alert.key))
    const delivered = [...new Set([...current.sentToasts, ...current.sentDesktop])].filter((key) => keys.has(key))
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts, delivered }),
      })
      if (!response.ok) return
      const data = (await response.json()) as { fired?: unknown }
      const fired = Array.isArray(data.fired) ? data.fired.filter((item): item is string => typeof item === 'string') : []
      // Only store what is new, so a quiet sync does not touch the database.
      const after = latest.current
      const newToasts = fired.filter((key) => !after.sentToasts.includes(key))
      const newDesktop = fired.filter((key) => !after.sentDesktop.includes(key))
      if (newToasts.length) after.markToastSent(newToasts)
      if (newDesktop.length) after.markDesktopSent(newDesktop)
    } catch {
      // No local server is listening. The app still alerts on its own while it is open.
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    setReady(false)
    lastSchedule.current = ''
    if (!userId) return
    const readyTimer = window.setTimeout(() => setReady(true), 2000)
    const id = window.setInterval(() => void sync(), 10000)
    return () => {
      window.clearTimeout(readyTimer)
      window.clearInterval(id)
    }
  }, [userId, sync])

  useEffect(() => {
    if (!userId) return
    const schedule = JSON.stringify(tasks.filter((task) => !task.done).map((task) => [task.id, task.date, task.time, task.title]))
    if (schedule === lastSchedule.current) return
    lastSchedule.current = schedule
    void sync()
  }, [userId, tasks, sync])

  return ready
}
