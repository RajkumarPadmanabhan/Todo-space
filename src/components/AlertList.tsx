import type { Task } from '../types'
import { formatPrettyDate, formatTaskTime, taskCountdown } from '../utils'

export function AlertList({
  tasks,
  now,
  onEdit,
  compact = false,
}: {
  tasks: Task[]
  now: Date
  onEdit: (task: Task) => void
  compact?: boolean
}) {
  if (!tasks.length) return <p className="empty-copy">Nothing due in the next 24 hours.</p>
  return (
    <ul className={compact ? 'alert-list compact' : 'alert-list'}>
      {tasks.map((task) => (
        <li key={task.id}>
          <button type="button" className="alert-item" onClick={() => onEdit(task)}>
            <strong>
              {task.title} within 24 hrs
            </strong>
            <span className="count-line">{taskCountdown(task, now)}</span>
            <span className="muted">
              {formatPrettyDate(task.date)} · {formatTaskTime(task.time)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
