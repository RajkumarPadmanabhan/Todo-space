import { useEffect, useRef } from 'react'
import type { Task } from './types'
import { alertKey, countdownLabel, isWithin24h, notifyDesktop, taskDue } from './utils'

const toastInflight = new Set<string>()
const desktopInflight = new Set<string>()

type Args = {
  userId: string | null
  tasks: Task[]
  sentToasts: string[]
  sentDesktop: string[]
  minute: number
  tick: number
  markToastSent: (keys: string[]) => void
  markDesktopSent: (keys: string[]) => void
  pushToast: (text: string) => void
}

export function useAlerts({
  userId,
  tasks,
  sentToasts,
  sentDesktop,
  minute,
  tick,
  markToastSent,
  markDesktopSent,
  pushToast,
}: Args) {
  const sentRef = useRef({ toasts: sentToasts, desktop: sentDesktop })
  sentRef.current = { toasts: sentToasts, desktop: sentDesktop }

  useEffect(() => {
    if (!userId) return

    const run = () => {
      const now = new Date()
      const due = tasks.filter((task) => !task.done && isWithin24h(taskDue(task), now))

      const toastFresh = due.filter((task) => {
        const key = alertKey(task)
        if (sentRef.current.toasts.includes(key) || toastInflight.has(key)) return false
        toastInflight.add(key)
        return true
      })
      if (toastFresh.length) {
        markToastSent(toastFresh.map(alertKey))
        toastFresh.forEach((task) => pushToast(`${task.title} within 24 hrs`))
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const deskFresh = due.filter((task) => {
          const key = alertKey(task)
          if (sentRef.current.desktop.includes(key) || desktopInflight.has(key)) return false
          desktopInflight.add(key)
          return true
        })
        if (deskFresh.length) {
          markDesktopSent(deskFresh.map(alertKey))
          deskFresh.forEach((task) => {
            const dueAt = taskDue(task)
            notifyDesktop(`${task.title} within 24 hrs`, countdownLabel(dueAt, now), alertKey(task))
          })
        }
      }
    }

    run()
    const id = window.setInterval(run, 10000)
    return () => window.clearInterval(id)
  }, [userId, tasks, minute, tick, markToastSent, markDesktopSent, pushToast])
}
