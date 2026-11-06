import { useState, type FormEvent } from 'react'
import type { Task, TaskDraft } from '../types'
import { useStore } from '../store'
import { compareTasks, dateKey, defaultTime, formatPrettyDate, formatTaskTime, taskCountdown } from '../utils'

export function VaultPage({
  now,
  open,
  onOpen,
  onLock,
  onEdit,
}: {
  now: Date
  open: boolean
  onOpen: () => void
  onLock: () => void
  onEdit: (task: Task) => void
}) {
  const {
    user,
    tasks,
    vaultTasks,
    documents,
    setVaultPin,
    checkVaultPin,
    vaultTask,
    unvaultTask,
    deleteTask,
    restoreTask,
    addTask,
    saveDocument,
    deleteDocument,
  } = useStore()
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [docTitle, setDocTitle] = useState('')
  const [docBody, setDocBody] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [moveId, setMoveId] = useState('')

  if (!user) return null
  const account = user
  const active = vaultTasks.filter((task) => !task.deletedAt).slice().sort(compareTasks)
  const removed = vaultTasks.filter((task) => task.deletedAt).slice().sort(compareTasks)

  async function unlock(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    if (!account.hasVaultPin) {
      if (!/^\d{4,8}$/.test(pin)) {
        setBusy(false)
        setError('Use a 4 to 8 digit PIN.')
        return
      }
      if (pin !== confirm) {
        setBusy(false)
        setError('Those PINs don’t match.')
        return
      }
      const result = await setVaultPin('', pin)
      setBusy(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPin('')
      setConfirm('')
      onOpen()
      return
    }
    const ok = await checkVaultPin(pin)
    setBusy(false)
    if (!ok) {
      setError('That vault PIN doesn’t match.')
      return
    }
    setPin('')
    onOpen()
  }

  function addNote(event: FormEvent) {
    event.preventDefault()
    if (!noteTitle.trim()) {
      setError('Give the vault note a title.')
      return
    }
    const draft: TaskDraft = {
      title: noteTitle,
      note: noteBody,
      date: dateKey(now),
      time: defaultTime(now),
      color: 'lavender',
      done: false,
      folderId: null,
    }
    addTask(draft, true)
    setNoteTitle('')
    setNoteBody('')
    setError('')
  }

  function addDoc(event: FormEvent) {
    event.preventDefault()
    if (!docTitle.trim() && !docBody.trim()) {
      setError('Add a title or some text for the document.')
      return
    }
    saveDocument(null, docTitle, docBody)
    setDocTitle('')
    setDocBody('')
    setError('')
  }

  if (!open) {
    return (
      <form className="panel vault-gate" onSubmit={(event) => void unlock(event)}>
        <h2>{account.hasVaultPin ? 'Secret vault' : 'Create a vault PIN'}</h2>
        <p className="muted">
          {account.hasVaultPin
            ? 'Enter the 4 to 8 digit PIN. It is not the app password.'
            : 'Choose a 4 to 8 digit PIN. It has to be different from the app password, and you create it on its own.'}
        </p>
        <label className="field">
          Vault PIN
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            autoComplete="off"
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
          />
        </label>
        {!account.hasVaultPin && (
          <label className="field">
            Confirm PIN
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={confirm}
              autoComplete="off"
              onChange={(event) => setConfirm(event.target.value.replace(/\D/g, '').slice(0, 8))}
            />
          </label>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="add-btn" type="submit" disabled={busy}>
          {busy ? 'One moment…' : account.hasVaultPin ? 'Open vault' : 'Create vault PIN'}
        </button>
      </form>
    )
  }

  return (
    <div className="vault-layout">
      <div className="panel-head">
        <h2 className="detail-title">Secret vault</h2>
        <button type="button" className="text-btn strong" onClick={onLock}>
          Lock vault
        </button>
      </div>
      <p className="muted">Notes and documents in here stay off the calendar, the todo list, and the month folders.</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="vault-grid">
        <section className="panel">
          <h2>Notes</h2>
          <form className="stack" onSubmit={addNote}>
            <input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder="Note title" maxLength={80} aria-label="Vault note title" />
            <textarea value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Note" rows={3} aria-label="Vault note" />
            <button className="add-btn" type="submit">
              Add note to vault
            </button>
          </form>
          {tasks.length > 0 && (
            <form
              className="inline-form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!moveId) return
                vaultTask(moveId)
                setMoveId('')
              }}
            >
              <select value={moveId} aria-label="Note to move into the vault" onChange={(event) => setMoveId(event.target.value)}>
                <option value="">Move an existing note…</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
              <button className="add-btn" type="submit" disabled={!moveId}>
                Move in
              </button>
            </form>
          )}
          {active.length === 0 && <p className="empty-copy">No notes in the vault yet.</p>}
          <div className="stack">
            {active.map((task) => (
              <article key={task.id} className="todo-row tcard-lavender">
                <div className="todo-top">
                  <div className="todo-copy">
                    <div className="todo-kicker">
                      {formatPrettyDate(task.date)} · {formatTaskTime(task.time)}
                    </div>
                    <h3>
                <span className="title-mark">{task.title}</span>
              </h3>
                    {task.note && <p className="note">{task.note}</p>}
                    <p className="count-line">{taskCountdown(task, now)}</p>
                  </div>
                  <div className="todo-side">
                    <button type="button" className="linkish" onClick={() => onEdit(task)}>
                      Edit
                    </button>
                    <button type="button" className="linkish" onClick={() => unvaultTask(task.id)}>
                      Move out
                    </button>
                    <button type="button" className="linkish" onClick={() => deleteTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {removed.length > 0 && <h3 className="group-label">Deleted</h3>}
          {removed.map((task) => (
            <article key={task.id} className="todo-row is-done">
              <div className="todo-top">
                <div>
                  <h3>
                <span className="title-mark">{task.title}</span>
              </h3>
                  <p className="count-line">Deleted</p>
                </div>
                <button type="button" className="linkish" onClick={() => restoreTask(task.id)}>
                  Restore
                </button>
              </div>
            </article>
          ))}
        </section>
        <section className="panel">
          <h2>Documents</h2>
          <form className="stack" onSubmit={addDoc}>
            <input value={docTitle} onChange={(event) => setDocTitle(event.target.value)} placeholder="Document title" maxLength={120} aria-label="Document title" />
            <textarea value={docBody} onChange={(event) => setDocBody(event.target.value)} placeholder="Write the document" rows={6} aria-label="Document" />
            <button className="add-btn" type="submit">
              Save document
            </button>
          </form>
          {documents.length === 0 && <p className="empty-copy">No documents in the vault yet.</p>}
          <div className="stack">
            {documents
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((doc) => (
                <article key={doc.id} className="todo-row tcard-blue">
                  <h3>{doc.title}</h3>
                  {doc.body && <p className="note doc-body">{doc.body}</p>}
                  <button type="button" className="linkish" onClick={() => deleteDocument(doc.id)}>
                    Delete
                  </button>
                </article>
              ))}
          </div>
        </section>
      </div>
    </div>
  )
}
