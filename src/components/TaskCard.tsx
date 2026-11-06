import { FolderMark } from './FolderMark'
import type { Task } from '../types'
import { cx, formatTaskTime, isWithin24h, taskCountdown, taskDue } from '../utils'

type Props = {
  task: Task
  now: Date
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
}

export function TaskCard({ task, now, onEdit, onToggle }: Props) {
  const due = taskDue(task)
  const soon = !task.done && isWithin24h(due, now)
  return (
    <article className={cx('tcard', `tcard-${task.color}`, task.done && 'is-done')} data-task-id={task.id}>
      <header className="tcard-top">
        <span className="tcard-time">
          {formatTaskTime(task.time)}
          <FolderMark folderId={task.folderId} />
        </span>
        {soon && <span className="pill-24">within 24 hrs</span>}
      </header>
      <h3>
        <span className="title-mark">{task.title}</span>
      </h3>
      {task.note && <p className="note">{task.note}</p>}
      <p className="count-line">{taskCountdown(task, now)}</p>
      <div className="tcard-actions">
        <button type="button" className="linkish" onClick={() => onToggle(task.id)}>
          {task.done ? 'Reopen' : 'Done'}
        </button>
        <button type="button" className="linkish" onClick={() => onEdit(task)}>
          Edit
        </button>
      </div>
    </article>
  )
}
