import { useEffect, useState, type FormEvent } from 'react'
import type { Folder, Task, TaskColor, TaskDraft } from '../types'
import { countdownLabel, monthCategory, monthTitle, taskDue } from '../utils'

const COLORS: { id: TaskColor; label: string }[] = [
  { id: 'yellow', label: 'Sand' },
  { id: 'pink', label: 'Blush' },
  { id: 'lavender', label: 'Lilac' },
  { id: 'blue', label: 'Sky' },
  { id: 'mint', label: 'Mint' },
]

type Props = {
  initial?: Task
  presetDate?: string
  presetTime: string
  presetFolderId?: string | null
  folders: Folder[]
  now: Date
  onClose: () => void
  onSave: (draft: TaskDraft, id?: string) => void
  onDelete?: () => void
}

export function TaskModal({ initial, presetDate, presetTime, presetFolderId, folders, now, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [date, setDate] = useState(initial?.date ?? presetDate ?? '')
  const [time, setTime] = useState(initial?.time ?? presetTime)
  const [color, setColor] = useState<TaskColor>(initial?.color ?? 'yellow')
  const [done, setDone] = useState(initial?.done ?? false)
  const [folderId, setFolderId] = useState<string | null>(initial?.folderId ?? presetFolderId ?? null)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const preview = date && time ? countdownLabel(taskDue({ date, time }), now) : 'Pick a date and time to see the countdown.'

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Give the note a title.')
      return
    }
    if (!date || !time) {
      setError('Choose when this note is due.')
      return
    }
    onSave({ title, note, date, time, color, done, folderId }, initial?.id)
  }

  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <h2 id="task-title">{initial ? 'Edit note' : 'Add a note'}</h2>
        <label className="field">
          Title
          <input autoFocus value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} placeholder="Pack the presentation" />
        </label>
        <label className="field">
          Note
          <textarea value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Anything you want to remember" />
        </label>
        <div className="split">
          <label className="field">
            Date
            <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label className="field">
            Time
            <input type="time" required value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
        </div>
        <div className="field">
          Color
          <div className="swatches">
            {COLORS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`swatch swatch-${item.id}${color === item.id ? ' active' : ''}`}
                aria-label={item.label}
                aria-pressed={color === item.id}
                onClick={() => setColor(item.id)}
              />
            ))}
          </div>
        </div>
        <label className="field">
          Folder
          <select value={folderId ?? ''} onChange={(event) => setFolderId(event.target.value || null)}>
            <option value="">No folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
        {date && (
          <p className="muted filing-note">
            Filed in {monthTitle(date)} · {done || monthCategory({ date, time: time || '00:00', done, deletedAt: null }, now) === 'past' ? 'Past' : 'Upcoming'}
            . Deleting keeps it in that month under Deleted.
          </p>
        )}
        {initial && (
          <label className="check-row">
            <input type="checkbox" checked={done} onChange={(event) => setDone(event.target.checked)} />
            Completed
          </label>
        )}
        <p className="count-line preview-count">{done ? 'Completed' : preview}</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          {onDelete ? (
            confirmDelete ? (
              <div className="row-gap">
                <span className="muted">Delete this note?</span>
                <button type="button" className="danger" onClick={onDelete}>
                  Delete
                </button>
                <button type="button" className="text-btn" onClick={() => setConfirmDelete(false)}>
                  Keep
                </button>
              </div>
            ) : (
              <button type="button" className="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            )
          ) : (
            <span />
          )}
          <div className="row-gap">
            <button type="button" className="text-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-btn">
              {initial ? 'Save note' : 'Add note'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
