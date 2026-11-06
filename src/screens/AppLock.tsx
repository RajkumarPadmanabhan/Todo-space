import { useState, type FormEvent } from 'react'
import { Avatar } from '../components/Avatar'
import { useStore } from '../store'

export function AppLock({ mode, onUnlocked, onSkip }: { mode: 'unlock' | 'create'; onUnlocked: () => void; onSkip?: () => void }) {
  const { user, setAppPassword, checkAppPassword } = useStore()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!user) return null

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    if (mode === 'unlock') {
      const ok = await checkAppPassword(password)
      setBusy(false)
      if (!ok) {
        setError('That app password doesn’t match.')
        return
      }
      onUnlocked()
      return
    }
    if (password.length < 4) {
      setBusy(false)
      setError('Use at least 4 characters.')
      return
    }
    if (password !== confirm) {
      setBusy(false)
      setError('Those passwords don’t match.')
      return
    }
    const result = await setAppPassword('', password)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onUnlocked()
  }

  return (
    <div className="auth">
      <form className="lock-card" onSubmit={(event) => void submit(event)}>
        <Avatar src={user.avatar} name={user.name} size={84} />
        <h1>{mode === 'unlock' ? 'Welcome back' : 'Create an app password'}</h1>
        <p className="muted">
          {mode === 'unlock'
            ? 'Enter the app password for To-Dey. This is separate from your email login and from the vault PIN.'
            : 'To-Dey will ask for this whenever you open the app. It stays separate from the secret vault PIN.'}
        </p>
        <label className="field">
          App password
          <input
            autoFocus
            type="password"
            value={password}
            autoComplete="off"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {mode === 'create' && (
          <label className="field">
            Confirm app password
            <input type="password" value={confirm} autoComplete="off" onChange={(event) => setConfirm(event.target.value)} />
          </label>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="add-btn wide" type="submit" disabled={busy}>
          {busy ? 'One moment…' : mode === 'unlock' ? 'Unlock' : 'Save app password'}
        </button>
        {mode === 'create' && onSkip && (
          <button className="text-btn" type="button" onClick={onSkip}>
            Not now
          </button>
        )}
      </form>
    </div>
  )
}
