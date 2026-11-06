import { useState, type FormEvent } from 'react'
import { FolderMark } from '../components/FolderMark'
import type { MonthCategory, Task } from '../types'
import { useStore } from '../store'
import {
  compareTasks,
  cx,
  formatPrettyDate,
  formatTaskTime,
  matchesQuery,
  monthCategory,
  monthKey,
  monthTitle,
  taskCountdown,
} from '../utils'

const CATEGORIES: { id: MonthCategory; label: string; hint: string }[] = [
  { id: 'upcoming', label: 'Upcoming', hint: 'Still ahead this month.' },
  { id: 'past', label: 'Past', hint: 'Completed, or the time has already passed.' },
  { id: 'deleted', label: 'Deleted', hint: 'Removed notes stay in this month.' },
]

type Selection = { kind: 'month'; key: string } | { kind: 'folder'; id: string } | null

export function FoldersPage({
  now,
  search,
  onEdit,
  onToggle,
  onCreate,
}: {
  now: Date
  search: string
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
  onCreate: (date?: string, folderId?: string | null) => void
}) {
  const { allTasks, folders, createFolder, renameFolder, deleteFolder, restoreTask, moveTask } = useStore()
  const [selection, setSelection] = useState<Selection>(null)
  const [category, setCategory] = useState<MonthCategory>('upcoming')
  const [creating, setCreating] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const query = search.trim().toLowerCase()
  const months = groupMonths(allTasks, query)
  const custom = folders
    .filter((folder) => !query || folder.name.toLowerCase().includes(query) || allTasks.some((task) => task.folderId === folder.id && taskMatches(task, query)))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))

  const selectedMonth = selection?.kind === 'month' ? months.find((month) => month.key === selection.key) : undefined
  const selectedFolder = selection?.kind === 'folder' ? folders.find((folder) => folder.id === selection.id) : undefined

  function submitFolder(event: FormEvent) {
    event.preventDefault()
    const result = createFolder(folderName)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setFolderName('')
    setCreating(false)
    setError('')
    if (result.id) setSelection({ kind: 'folder', id: result.id })
  }

  return (
    <div className="folders-layout">
      <aside className="folder-rail">
        <div className="rail-block">
          <div className="panel-head">
            <h2>Months</h2>
            <span className="auto-tag">Auto</span>
          </div>
          <p className="muted">A folder is created for each month. Notes move between Upcoming, Past, and Deleted on their own.</p>
          {months.length === 0 && <p className="empty-copy">Add a note and its month folder appears here.</p>}
          {months.map((month) => (
            <button
              key={month.key}
              type="button"
              className={cx('folder-link', selection?.kind === 'month' && selection.key === month.key && 'active')}
              onClick={() => {
                setSelection({ kind: 'month', key: month.key })
                setCategory('upcoming')
                setError('')
              }}
            >
              <span>{month.title}</span>
              <span className="muted">{month.tasks.length}</span>
            </button>
          ))}
        </div>
        <div className="rail-block">
          <div className="panel-head">
            <h2>Your folders</h2>
            <button type="button" className="text-btn strong" onClick={() => { setCreating((open) => !open); setError('') }}>
              {creating ? 'Close' : 'New folder'}
            </button>
          </div>
          {creating && (
            <form className="inline-form" onSubmit={submitFolder}>
              <input
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                placeholder="Folder name"
                maxLength={40}
                aria-label="Folder name"
              />
              <button className="add-btn" type="submit">
                Create
              </button>
            </form>
          )}
          {error && creating && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {custom.length === 0 && <p className="empty-copy">Group notes yourself, like Work or Home.</p>}
          {custom.map((folder) => {
            const count = allTasks.filter((task) => task.folderId === folder.id && !task.deletedAt).length
            return (
              <button
                key={folder.id}
                type="button"
                className={cx('folder-link', selection?.kind === 'folder' && selection.id === folder.id && 'active')}
                onClick={() => {
                  setSelection({ kind: 'folder', id: folder.id })
                  setRenaming(false)
                  setConfirmDelete(false)
                  setError('')
                }}
              >
                <span>{folder.name}</span>
                <span className="muted">{count}</span>
              </button>
            )
          })}
        </div>
      </aside>
      <section className="panel folder-detail">
        {!selection && (
          <div>
            <h2 className="detail-title">Folders</h2>
            <p className="muted detail-lead">
              Create a folder and drop notes into it. Every note is also filed by its month. When it is completed, past its time, or deleted, it stays in that month under Past or Deleted.
            </p>
          </div>
        )}
        {selection?.kind === 'month' && selectedMonth && (
          <MonthDetail
            title={selectedMonth.title}
            tasks={selectedMonth.tasks}
            category={category}
            now={now}
            onCategory={(next) => setCategory(next)}
            onEdit={onEdit}
            onToggle={onToggle}
            onRestore={restoreTask}
          />
        )}
        {selection?.kind === 'month' && !selectedMonth && <p className="empty-copy">That month is empty.</p>}
        {selectedFolder && (
          <FolderDetail
            name={selectedFolder.name}
            tasks={allTasks.filter((task) => task.folderId === selectedFolder.id && !task.deletedAt && taskMatches(task, query))}
            now={now}
            renaming={renaming}
            renameValue={renameValue}
            confirmDelete={confirmDelete}
            error={error}
            onRenameValue={setRenameValue}
            onStartRename={() => {
              setRenaming(true)
              setRenameValue(selectedFolder.name)
              setError('')
            }}
            onCancelRename={() => setRenaming(false)}
            onSaveRename={() => {
              const result = renameFolder(selectedFolder.id, renameValue)
              if (!result.ok) setError(result.error)
              else {
                setRenaming(false)
                setError('')
              }
            }}
            onAskDelete={() => setConfirmDelete(true)}
            onCancelDelete={() => setConfirmDelete(false)}
            onDelete={() => {
              deleteFolder(selectedFolder.id)
              setSelection(null)
              setConfirmDelete(false)
            }}
            onCreate={() => onCreate(undefined, selectedFolder.id)}
            onEdit={onEdit}
            onToggle={onToggle}
            onRemove={(id) => moveTask(id, null)}
          />
        )}
      </section>
    </div>
  )
}

function MonthDetail({
  title,
  tasks,
  category,
  now,
  onCategory,
  onEdit,
  onToggle,
  onRestore,
}: {
  title: string
  tasks: Task[]
  category: MonthCategory
  now: Date
  onCategory: (category: MonthCategory) => void
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
  onRestore: (id: string) => void
}) {
  const visible = tasks.filter((task) => monthCategory(task, now) === category).slice().sort(compareTasks)
  const hint = CATEGORIES.find((item) => item.id === category)?.hint
  return (
    <div>
      <div className="panel-head">
        <h2 className="detail-title">{title}</h2>
        <span className="auto-tag">Auto</span>
      </div>
      <div className="filters" role="tablist" aria-label="Month categories">
        {CATEGORIES.map((item) => {
          const count = tasks.filter((task) => monthCategory(task, now) === item.id).length
          return (
            <button key={item.id} type="button" role="tab" aria-selected={category === item.id} className={category === item.id ? 'active' : ''} onClick={() => onCategory(item.id)}>
              {item.label} {count}
            </button>
          )
        })}
      </div>
      <p className="muted">{hint}</p>
      {visible.length === 0 && <p className="empty-copy">Nothing in {category}.</p>}
      <div className="stack folder-tasks">
        {visible.map((task) => (
          <article key={task.id} className={cx('todo-row', `tcard-${task.color}`, task.done && 'is-done')}>
            <div className="todo-top">
            <div className="todo-copy">
              <div className="todo-kicker">
                {formatPrettyDate(task.date)} · {formatTaskTime(task.time)}
              </div>
              <h3>{task.title}</h3>
              {task.note && <p className="note">{task.note}</p>}
              <p className="count-line">{task.deletedAt ? 'Deleted' : taskCountdown(task, now)}</p>
            </div>
            <div className="todo-side">
              {category === 'deleted' ? (
                <button type="button" className="linkish" onClick={() => onRestore(task.id)}>
                  Restore
                </button>
              ) : (
                <>
                  <button type="button" className="linkish" onClick={() => onToggle(task.id)}>
                    {task.done ? 'Reopen' : 'Done'}
                  </button>
                  <button type="button" className="linkish" onClick={() => onEdit(task)}>
                    Edit
                  </button>
                </>
              )}
            </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function FolderDetail({
  name,
  tasks,
  now,
  renaming,
  renameValue,
  confirmDelete,
  error,
  onRenameValue,
  onStartRename,
  onCancelRename,
  onSaveRename,
  onAskDelete,
  onCancelDelete,
  onDelete,
  onCreate,
  onEdit,
  onToggle,
  onRemove,
}: {
  name: string
  tasks: Task[]
  now: Date
  renaming: boolean
  renameValue: string
  confirmDelete: boolean
  error: string
  onRenameValue: (value: string) => void
  onStartRename: () => void
  onCancelRename: () => void
  onSaveRename: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
  onCreate: () => void
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  const ordered = tasks.slice().sort(compareTasks)
  return (
    <div>
      <div className="panel-head">
        {renaming ? (
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault()
              onSaveRename()
            }}
          >
            <input value={renameValue} onChange={(event) => onRenameValue(event.target.value)} aria-label="Rename folder" maxLength={40} />
            <button className="add-btn" type="submit">
              Save
            </button>
            <button className="text-btn" type="button" onClick={onCancelRename}>
              Cancel
            </button>
          </form>
        ) : (
          <h2 className="detail-title">{name}</h2>
        )}
        {!renaming && (
          <div className="row-gap">
            <button type="button" className="text-btn strong" onClick={onStartRename}>
              Rename
            </button>
            <button type="button" className="add-btn" onClick={onCreate}>
              Add task
            </button>
          </div>
        )}
      </div>
      <p className="muted">Notes here are still filed into their month automatically.</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {confirmDelete ? (
        <div className="confirm-box">
          <p>Delete this folder? The notes stay on your list.</p>
          <div className="row-gap">
            <button type="button" className="danger" onClick={onDelete}>
              Delete folder
            </button>
            <button type="button" className="text-btn" onClick={onCancelDelete}>
              Keep
            </button>
          </div>
        </div>
      ) : (
        !renaming && (
          <button type="button" className="danger" onClick={onAskDelete}>
            Delete folder
          </button>
        )
      )}
      {ordered.length === 0 && <p className="empty-copy">This folder is empty. Add a task to put it here.</p>}
      <div className="stack folder-tasks">
        {ordered.map((task) => (
          <article key={task.id} className={cx('todo-row', `tcard-${task.color}`, task.done && 'is-done')}>
            <div className="todo-top">
            <div className="todo-copy">
              <div className="todo-kicker">
                {formatPrettyDate(task.date)} · {formatTaskTime(task.time)}
                <FolderMark folderId={task.folderId} />
              </div>
              <h3>{task.title}</h3>
              {task.note && <p className="note">{task.note}</p>}
              <p className="count-line">{taskCountdown(task, now)}</p>
            </div>
            <div className="todo-side">
              <button type="button" className="linkish" onClick={() => onToggle(task.id)}>
                {task.done ? 'Reopen' : 'Done'}
              </button>
              <button type="button" className="linkish" onClick={() => onEdit(task)}>
                Edit
              </button>
              <button type="button" className="linkish" onClick={() => onRemove(task.id)}>
                Remove
              </button>
            </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function groupMonths(tasks: Task[], query: string) {
  const map = new Map<string, Task[]>()
  for (const task of tasks) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(task.date)) continue
    if (query && !taskMatches(task, query) && !monthTitle(task.date).toLowerCase().includes(query)) continue
    const key = monthKey(task.date)
    const list = map.get(key) ?? []
    list.push(task)
    map.set(key, list)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({ key, title: monthTitle(`${key}-01`), tasks: items }))
}

function taskMatches(task: Task, query: string) {
  if (!query) return true
  return matchesQuery(task, query)
}
