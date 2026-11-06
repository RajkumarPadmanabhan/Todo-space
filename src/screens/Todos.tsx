import { useState } from 'react'
import { FolderMark } from '../components/FolderMark'
import type { Task } from '../types'
import { compareTasks, cx, dateKey, groupLabel, isWithin24h, matchesQuery, taskCountdown, taskDue, formatPrettyDate, formatTaskTime } from '../utils'

type Filter = 'all' | 'soon' | 'upcoming' | 'done'

export function Todos({
  tasks,
  now,
  search,
  onEdit,
  onToggle,
}: {
  tasks: Task[]
  now: Date
  search: string
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const today = dateKey(now)
  const filtered = tasks
    .filter((task) => matchesQuery(task, search))
    .filter((task) => {
      if (filter === 'done') return task.done
      if (task.done) return filter === 'all'
      if (filter === 'soon') return isWithin24h(taskDue(task), now)
      if (filter === 'upcoming') return task.date >= today
      return true
    })
    .slice()
    .sort((a, b) => {
      if (filter === 'all' && a.done !== b.done) return a.done ? 1 : -1
      return compareTasks(a, b)
    })

  const groups: { key: string; label: string; items: Task[] }[] = []
  for (const task of filtered) {
    const label = task.done ? 'Completed' : groupLabel(task.date, now)
    const key = task.done ? 'done' : task.date
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(task)
    else groups.push({ key, label, items: [task] })
  }

  return (
    <section>
      <div className="filters" role="tablist" aria-label="Todo filters">
        {(
          [
            ['all', 'All'],
            ['soon', 'Within 24 hrs'],
            ['upcoming', 'Upcoming'],
            ['done', 'Completed'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={filter === id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="empty-copy">Your notes will show up here, with a countdown under each one.</p>}
      {groups.map((group) => (
        <div key={group.key}>
          <h2 className="group-label">{group.label}</h2>
          {group.items.map((task) => {
            const soon = !task.done && isWithin24h(taskDue(task), now)
            return (
              <article key={task.id} className={cx('todo-row', `tcard-${task.color}`, task.done && 'is-done')}>
                <div className="todo-top">
                  <button
                    type="button"
                    className={cx('check', task.done && 'on')}
                    aria-label={task.done ? `Reopen ${task.title}` : `Complete ${task.title}`}
                    aria-pressed={task.done}
                    onClick={() => onToggle(task.id)}
                  />
                  <div className="todo-copy">
                    <div className="todo-kicker">
                      {formatPrettyDate(task.date)} · {formatTaskTime(task.time)}
                      <FolderMark folderId={task.folderId} />
                    </div>
                    <h3>
                      <span className="title-mark">{task.title}</span>
                    </h3>
                    {task.note && <p className="note">{task.note}</p>}
                    <p className="count-line">{taskCountdown(task, now)}</p>
                  </div>
                  <div className="todo-side">
                    {soon && <span className="pill-24">within 24 hrs</span>}
                    <button type="button" className="linkish" onClick={() => onEdit(task)}>
                      Edit
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ))}
    </section>
  )
}
