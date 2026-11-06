import { useRef, useState, type FormEvent } from 'react'
import { Avatar } from '../components/Avatar'
import { BackupControls } from '../components/BackupControls'
import { CropModal } from '../components/CropModal'
import { DeleteAccount } from '../components/DeleteAccount'
import { SecurityPanel } from '../components/SecurityPanel'
import { WallpaperPanel } from '../components/WallpaperPanel'
import { useStore } from '../store'

export function ProfilePage() {
  const { user, updateProfile, logout } = useStore()
  const [name, setName] = useState(user?.name ?? '')
  const [company, setCompany] = useState(user?.company ?? '')
  const [position, setPosition] = useState(user?.position ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  function save(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Name can’t be empty.')
      setSaved(false)
      return
    }
    updateProfile({ name, company, position })
    setError('')
    setSaved(true)
  }

  return (
    <div className="profile-stack">
    <section className="profile-grid">
      <div className="profile-card">
        <p className="preview-label">Preview</p>
        <Avatar src={user.avatar} name={name || user.name} size={120} />
        <h2>{name || 'Your name'}</h2>
        <p className="preview-role">{position || 'Position'}</p>
        <p className="preview-company">{company || 'Company'}</p>
        <p className="muted">{user.email}</p>
        <button type="button" className="text-btn strong" onClick={() => fileRef.current?.click()}>
          Change photo
        </button>
        <input
          ref={fileRef}
          hidden
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
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
          }}
        />
      </div>
      <form className="profile-form" onSubmit={save}>
        <label className="field">
          Display name
          <input value={name} onChange={(event) => { setName(event.target.value); setSaved(false) }} maxLength={60} />
        </label>
        <label className="field">
          Company
          <input value={company} maxLength={80} onChange={(event) => { setCompany(event.target.value); setSaved(false) }} placeholder="Northwind Studio" />
        </label>
        <label className="field">
          Position
          <input value={position} maxLength={80} onChange={(event) => { setPosition(event.target.value); setSaved(false) }} placeholder="Product designer" />
        </label>
        <label className="field">
          Email
          <input value={user.email} readOnly />
        </label>
        <p className="muted">Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}. This photo is what shows in your inbox.</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {saved && <p className="saved-note">Saved</p>}
        <div className="row-gap">
          <button className="add-btn" type="submit">
            Save profile
          </button>
          <button className="text-btn" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </form>
      {cropFile && (
        <CropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={(dataUrl) => {
            updateProfile({ avatar: dataUrl })
            setCropFile(null)
            setSaved(true)
          }}
        />
      )}
    </section>
    <SecurityPanel />
    <WallpaperPanel />
    <section className="panel backup-panel">
      <h2>Backup</h2>
      <p className="muted">Download a JSON file of this computer’s To-Dey data. After a reinstall, upload that file and your profiles, notes, folders, messages, and wallpaper come back.</p>
      <BackupControls showDownload restoreLabel="Upload backup" />
    </section>
    <DeleteAccount />
    </div>
  )
}
