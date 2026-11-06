import { useState, type FormEvent } from 'react'
import { useStore } from '../store'

export function SecurityPanel() {
  const { user, setAppPassword, setVaultPin } = useStore()
  const [appCurrent, setAppCurrent] = useState('')
  const [appNext, setAppNext] = useState('')
  const [appConfirm, setAppConfirm] = useState('')
  const [pinCurrent, setPinCurrent] = useState('')
  const [pinNext, setPinNext] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [appError, setAppError] = useState('')
  const [pinError, setPinError] = useState('')
  const [appSaved, setAppSaved] = useState(false)
  const [pinSaved, setPinSaved] = useState(false)
  if (!user) return null

  async function saveApp(event: FormEvent) {
    event.preventDefault()
    setAppSaved(false)
    if (appNext !== appConfirm) {
      setAppError('Those app passwords don’t match.')
      return
    }
    const result = await setAppPassword(appCurrent, appNext)
    if (!result.ok) {
      setAppError(result.error)
      return
    }
    setAppError('')
    setAppCurrent('')
    setAppNext('')
    setAppConfirm('')
    setAppSaved(true)
  }

  async function savePin(event: FormEvent) {
    event.preventDefault()
    setPinSaved(false)
    if (pinNext !== pinConfirm) {
      setPinError('Those vault PINs don’t match.')
      return
    }
    const result = await setVaultPin(pinCurrent, pinNext)
    if (!result.ok) {
      setPinError(result.error)
      return
    }
    setPinError('')
    setPinCurrent('')
    setPinNext('')
    setPinConfirm('')
    setPinSaved(true)
  }

  return (
    <section className="panel security-panel">
      <h2>Settings</h2>
      <p className="muted">The app password and the vault PIN are created separately. They cannot be the same.</p>
      <div className="security-grid">
        <form onSubmit={(event) => void saveApp(event)}>
          <h3>{user.hasAppPassword ? 'Change app password' : 'Create app password'}</h3>
          <p className="muted">Asked again each time you open To-Dey.</p>
          {user.hasAppPassword && (
            <label className="field">
              Current app password
              <input type="password" value={appCurrent} autoComplete="off" onChange={(event) => setAppCurrent(event.target.value)} />
            </label>
          )}
          <label className="field">
            New app password
            <input type="password" value={appNext} autoComplete="off" onChange={(event) => setAppNext(event.target.value)} />
          </label>
          <label className="field">
            Confirm app password
            <input type="password" value={appConfirm} autoComplete="off" onChange={(event) => setAppConfirm(event.target.value)} />
          </label>
          {appError && (
            <p className="form-error" role="alert">
              {appError}
            </p>
          )}
          {appSaved && <p className="saved-note">App password saved. It will be asked the next time you open To-Dey.</p>}
          <button className="add-btn" type="submit">
            Save app password
          </button>
        </form>
        <form onSubmit={(event) => void savePin(event)}>
          <h3>{user.hasVaultPin ? 'Change vault PIN' : 'Create vault PIN'}</h3>
          <p className="muted">4 to 8 digits. This only opens the secret vault.</p>
          {user.hasVaultPin && (
            <label className="field">
              Current vault PIN
              <input inputMode="numeric" maxLength={8} type="password" value={pinCurrent} autoComplete="off" onChange={(event) => setPinCurrent(event.target.value.replace(/\D/g, '').slice(0, 8))} />
            </label>
          )}
          <label className="field">
            New vault PIN
            <input inputMode="numeric" maxLength={8} type="password" value={pinNext} autoComplete="off" onChange={(event) => setPinNext(event.target.value.replace(/\D/g, '').slice(0, 8))} />
          </label>
          <label className="field">
            Confirm vault PIN
            <input inputMode="numeric" maxLength={8} type="password" value={pinConfirm} autoComplete="off" onChange={(event) => setPinConfirm(event.target.value.replace(/\D/g, '').slice(0, 8))} />
          </label>
          {pinError && (
            <p className="form-error" role="alert">
              {pinError}
            </p>
          )}
          {pinSaved && <p className="saved-note">Vault PIN saved.</p>}
          <button className="add-btn" type="submit">
            Save vault PIN
          </button>
        </form>
      </div>
    </section>
  )
}
