import { useEffect, useRef } from 'react'
import type { Task } from './types'
import { ALERT_STAGES, alertBody, alertHeadline, alertStageKey, currentAlertStage, notifyDesktop, stageWasSent } from './utils'

const toastInflight = new Set<string>()
const desktopInflight = new Set<string>()

type Args = {
  userId: string | null
  /** False until the local server has reported what it already delivered; alerts wait for it. */
  enabled: boolean
  tasks: Task[]
  sentToasts: string[]
  sentDesktop: string[]
  minute: number
  tick: number
  markToastSent: (keys: string[]) => void
  markDesktopSent: (keys: string[]) => void
  pushToast: (text: string) => void
}

/**
 * Alerts each open task at four moments: 24 hours before, on the day, an hour before, and when it is due.
 * A task that has already reached a later stage skips the earlier ones, so opening the app close to a
 * due time shows one alert, not three.
 */
export function useAlerts({
  userId,
  enabled,
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
    if (!userId || !enabled) return

    const run = () => {
      const now = new Date()
      const desktopOn = typeof Notification !== 'undefined' && Notification.permission === 'granted'
      const toastKeys: string[] = []
      const desktopKeys: string[] = []

      for (const task of tasks) {
        if (task.done) continue
        const stage = currentAlertStage(task, now)
        if (!stage) continue
        const key = alertStageKey(task, stage)
        // This stage and every earlier one count as delivered once this one goes out.
        const covered = ALERT_STAGES.slice(0, ALERT_STAGES.indexOf(stage) + 1).map((item) => alertStageKey(task, item))

        if (!stageWasSent(sentRef.current.toasts, task, stage) && !toastInflight.has(key)) {
          covered.forEach((item) => toastInflight.add(item))
          toastKeys.push(...covered)
          pushToast(alertHeadline(task, stage))
        }

        if (desktopOn && !stageWasSent(sentRef.current.desktop, task, stage) && !desktopInflight.has(key)) {
          covered.forEach((item) => desktopInflight.add(item))
          desktopKeys.push(...covered)
          notifyDesktop(alertHeadline(task, stage), alertBody(task), key)
        }
      }

      if (toastKeys.length) markToastSent(toastKeys)
      if (desktopKeys.length) markDesktopSent(desktopKeys)
    }

    run()
    const id = window.setInterval(run, 10000)
    return () => window.clearInterval(id)
  }, [userId, enabled, tasks, minute, tick, markToastSent, markDesktopSent, pushToast])
}
