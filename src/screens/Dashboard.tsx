import { useState, type ReactNode } from 'react'
import { TaskCard } from '../components/TaskCard'
import type { Task } from '../types'
import {
  WEEKDAYS,
  addDays,
  addMonths,
  compareTasks,
  cx,
  dateKey,
  formatClock,
  formatMonth,
  formatPrettyDate,
  formatRange,
  formatTaskTime,
  matchesQuery,
  monthMatrix,
  sameDay,
  startOfWeek,
  taskCountdown,
  taskDue,
} from '../utils'

type Mode = 'today' | 'week' | 'month'

type Props = {
  tasks: Task[]
  now: Date
  search: string
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
  onCreate: (date: string) => void
}

export function Dashboard({ tasks, now, search, onEdit, onToggle, onCreate }: Props) {
  const [mode, setMode] = useState<Mode>('week')
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState(() => dateKey(new Date()))

  const visible = tasks.filter((task) => matchesQuery(task, search)).slice().sort(compareTasks)
  const weekStart = startOfWeek(cursor)
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const rangeLabel = mode === 'month' ? formatMonth(cursor) : mode === 'today' ? 'Today' : formatRange(weekStart, addDays(weekStart, 6))
  const showingToday =
    mode === 'today' ||
    (mode === 'week' && weekDays.some((day) => sameDay(day, now))) ||
    (mode === 'month' && cursor.getMonth() === now.getMonth() && cursor.getFullYear() === now.getFullYear())

  function shift(direction: number) {
    if (mode === 'month') setCursor((current) => addMonths(current, direction))
    else setCursor((current) => addDays(current, direction * 7))
  }

  return (
    <section className="calendar">
      <div className="cal-toolbar" data-tour="tour-calendar">
        <div className="cal-toolbar-left">
          {mode !== 'today' && (
            <button type="button" className="nav-arrow" aria-label={mode === 'month' ? 'Previous month' : 'Previous week'} onClick={() => shift(-1)}>
              ‹
            </button>
          )}
          <div>
            <div className="week-label">{rangeLabel}</div>
            <div className="live-clock">
              <span className="live-dot" />
              <span>{formatClock(now)}</span>
            </div>
          </div>
          {mode !== 'today' && (
            <button type="button" className="nav-arrow" aria-label={mode === 'month' ? 'Next month' : 'Next week'} onClick={() => shift(1)}>
              ›
            </button>
          )}
          {!showingToday && (
            <button
              type="button"
              className="text-btn strong"
              onClick={() => {
                setCursor(new Date())
                setSelected(dateKey(now))
              }}
            >
              Jump to today
            </button>
          )}
        </div>
        <div className="view-switch" role="tablist" aria-label="Calendar range">
          {(['today', 'week', 'month'] as const).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={mode === item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {mode === 'week' && (
        <div className="week-scroll">
          <div className="week-grid">
            {weekDays.map((day, index) => {
              const key = dateKey(day)
              const today = sameDay(day, now)
              const dayTasks = visible.filter((task) => task.date === key)
              return (
                <section key={key} className={cx('day-col', today && 'is-today')}>
                  <header className={cx('day-head', today && 'today')}>
                    <div className="day-chip">
                      <span className="day-name">{WEEKDAYS[index]}</span>
                      <span className="day-num">{day.getDate()}</span>
                      {today && <span className="day-today-tag">today</span>}
                    </div>
                    <button type="button" className="day-add" aria-label={`Add task on ${formatPrettyDate(key)}`} onClick={() => onCreate(key)}>
                      +
                    </button>
                  </header>
                  <div className="day-body">
                    <DayTasks tasks={dayTasks} now={now} today={today} onEdit={onEdit} onToggle={onToggle} />
                    {dayTasks.length === 0 && <p className="day-empty">Nothing planned</p>}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      )}

      {mode === 'today' && <TodayView tasks={visible} now={now} onEdit={onEdit} onToggle={onToggle} onCreate={onCreate} />}

      {mode === 'month' && (
        <MonthView
          cursor={cursor}
          now={now}
          tasks={visible}
          selected={selected}
          onSelect={setSelected}
          onEdit={onEdit}
          onToggle={onToggle}
          onCreate={onCreate}
        />
      )}
    </section>
  )
}

function DayTasks({
  tasks,
  now,
  today,
  onEdit,
  onToggle,
}: {
  tasks: Task[]
  now: Date
  today: boolean
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
}) {
  let placed = false
  const nodes: ReactNode[] = []
  if (tasks.length === 0 && today) nodes.push(<NowLine key="now" now={now} />)
  for (const task of tasks) {
    if (today && !placed && taskDue(task).getTime() > now.getTime()) {
      nodes.push(<NowLine key="now" now={now} />)
      placed = true
    }
    nodes.push(<TaskCard key={task.id} task={task} now={now} onEdit={onEdit} onToggle={onToggle} />)
  }
  if (today && tasks.length > 0 && !placed) nodes.push(<NowLine key="now" now={now} />)
  return <>{nodes}</>
}

function NowLine({ now }: { now: Date }) {
  const label = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return (
    <div className="now-line" role="separator" aria-label={`Now ${label}`}>
      <span>{label}</span>
    </div>
  )
}

function TodayView({
  tasks,
  now,
  onEdit,
  onToggle,
  onCreate,
}: {
  tasks: Task[]
  now: Date
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
  onCreate: (date: string) => void
}) {
  const todayKey = dateKey(now)
  const todayTasks = tasks.filter((task) => task.date === todayKey)
  const upcoming = tasks.filter((task) => !task.done && task.date > todayKey).slice(0, 6)
  return (
    <div className="today-layout">
      <div className="panel">
        <div className="panel-head">
          <h2>Today</h2>
          <button type="button" className="text-btn strong" onClick={() => onCreate(todayKey)}>
            Add for today
          </button>
        </div>
        {todayTasks.length === 0 && <p className="empty-copy">Nothing planned today.</p>}
        <div className="stack">
          <DayTasks tasks={todayTasks} now={now} today onEdit={onEdit} onToggle={onToggle} />
        </div>
      </div>
      <aside className="panel">
        <h2>Coming up</h2>
        {upcoming.length === 0 && <p className="empty-copy">Notes you schedule for later will show their countdown here.</p>}
        <ul className="coming-list">
          {upcoming.map((task) => (
            <li key={task.id}>
              <button type="button" className={cx('coming-item', `tcard-${task.color}`)} onClick={() => onEdit(task)}>
                <strong>
                  <span className="title-mark">{task.title}</span>
                </strong>
                <span className="muted">
                  {formatPrettyDate(task.date)} · {formatTaskTime(task.time)}
                </span>
                <span className="count-line">{taskCountdown(task, now)}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

function MonthView({
  cursor,
  now,
  tasks,
  selected,
  onSelect,
  onEdit,
  onToggle,
  onCreate,
}: {
  cursor: Date
  now: Date
  tasks: Task[]
  selected: string
  onSelect: (key: string) => void
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
  onCreate: (date: string) => void
}) {
  const weeks = monthMatrix(cursor)
  const selectedTasks = tasks.filter((task) => task.date === selected)
  return (
    <div>
      <div className="month-grid">
        {WEEKDAYS.map((day) => (
          <div key={day} className="month-dow">
            {day.slice(0, 3)}
          </div>
        ))}
        {weeks.flat().map((day) => {
          const key = dateKey(day)
          const items = tasks.filter((task) => task.date === key)
          const outside = day.getMonth() !== cursor.getMonth()
          return (
            <button
              key={key}
              type="button"
              className={cx('month-cell', outside && 'out', sameDay(day, now) && 'today', selected === key && 'selected')}
              onClick={() => onSelect(key)}
            >
              <span className="mnum">{day.getDate()}</span>
              {items.slice(0, 3).map((task) => (
                <span key={task.id} className={cx('chip', `tcard-${task.color}`)}>
                  {task.title}
                </span>
              ))}
              {items.length > 3 && <span className="more-chip">+{items.length - 3}</span>}
            </button>
          )
        })}
      </div>
      <div className="day-detail panel">
        <div className="panel-head">
          <h2>{formatPrettyDate(selected)}</h2>
          <button type="button" className="text-btn strong" onClick={() => onCreate(selected)}>
            Add note
          </button>
        </div>
        {selectedTasks.length === 0 && <p className="empty-copy">Nothing planned.</p>}
        <div className="stack">
          {selectedTasks.map((task) => (
            <TaskCard key={task.id} task={task} now={now} onEdit={onEdit} onToggle={onToggle} />
          ))}
        </div>
      </div>
    </div>
  )
}
