import { useRef, useState, type FormEvent } from 'react'
import { Avatar } from '../components/Avatar'
import { BackupControls } from '../components/BackupControls'
import { CropModal } from '../components/CropModal'
import { ThemeToggle } from '../components/ThemeToggle'
import { useStore } from '../store'

export function AuthScreen() {
  const { login, register } = useStore()
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function switchMode(next: 'login' | 'register') {
    setMode(next)
    setError('')
  }

  function onFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Use a photo smaller than 8 MB.')
      return
    }
    setError('')
    setCropFile(file)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result =
      mode === 'login' ? await login(email, password) : await register({ name, email, password, avatar })
    if (!result.ok) setError(result.error)
    setBusy(false)
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <ThemeToggle className="auth-theme" />
        <aside className="auth-aside">
          <div className="auth-motion" aria-hidden="true">
            <span className="auth-orb auth-orb-amber" />
            <span className="auth-orb auth-orb-teal" />
            <span className="auth-orb auth-orb-cream" />
            <span className="auth-ring" />
          </div>
          <div className="brand">
            <span className="brand-mark">To-Dey</span>
            <span className="brand-name">Notes that count down</span>
          </div>
        </aside>
        <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>
              Create profile
            </button>
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
              Log in
            </button>
          </div>
          {mode === 'register' && (
            <label className="field">
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Dr. Olivia" autoComplete="name" required />
            </label>
          )}
          <label className="field">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" autoComplete="email" inputMode="email" required />
          </label>
          <label className="field">
            Password
            <span className="password-row">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
              <button type="button" className="text-btn" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>
          {mode === 'register' && (
            <div className="field">
              Profile photo
              <div className="photo-pick">
                <Avatar src={avatar} name={name || 'You'} size={72} />
                <div>
                  <button type="button" className="text-btn strong" onClick={() => fileRef.current?.click()}>
                    {avatar ? 'Crop again' : 'Upload photo'}
                  </button>
                  <p className="muted">You’ll position and crop it before the profile is created.</p>
                </div>
              </div>
              <input
                ref={fileRef}
                hidden
                type="file"
                accept="image/*"
                onChange={(event) => {
                  onFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="add-btn wide" type="submit" disabled={busy || (mode === 'register' && !avatar)}>
            {busy ? 'One moment…' : mode === 'login' ? 'Log in' : 'Create profile'}
          </button>
          {mode === 'register' && !avatar && <p className="muted">Add a profile photo to continue.</p>}
          <div className="restore-block">
            <p className="muted">Already used To-Dey on this computer before? Upload your JSON backup.</p>
            <BackupControls showDownload={false} restoreLabel="Restore a backup" />
          </div>
        </form>
      </div>
      {cropFile && (
        <CropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={(dataUrl) => {
            setAvatar(dataUrl)
            setCropFile(null)
          }}
        />
      )}
    </div>
  )
}
