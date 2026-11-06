import { useState, type FormEvent } from 'react'
import { useStore } from '../store'

export function DeleteAccount() {
  const { deleteAccount } = useStore()
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!confirmed) {
      setError('Tick the box to confirm you want this profile removed.')
      return
    }
    setBusy(true)
    setError('')
    const result = await deleteAccount(password)
    if (!result.ok) setError(result.error)
    setBusy(false)
  }

  return (
    <section className="panel danger-panel">
      <h2>Delete account</h2>
      <p className="muted">
        This removes your profile, notes, folders, vault, and messages from this computer. Other profiles stay. Download a backup first if you want a copy.
      </p>
      <form className="delete-form" onSubmit={(event) => void onSubmit(event)}>
        <label className="field">
          Login password
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <label className="check-row">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          I understand this profile will be removed from this computer.
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="danger-btn" type="submit" disabled={busy}>
          {busy ? 'One moment…' : 'Delete this account'}
        </button>
      </form>
    </section>
  )
}
