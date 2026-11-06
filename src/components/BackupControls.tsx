import { useRef, useState } from 'react'
import { downloadBackupFile } from '../backup'
import { useStore } from '../store'

export function BackupControls({
  showDownload,
  restoreLabel,
}: {
  showDownload: boolean
  restoreLabel: string
}) {
  const { users, exportBackup, importBackup } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function onFile(file: File | undefined) {
    if (!file) return
    setError('')
    setNotice('')
    if (file.size > 30 * 1024 * 1024) {
      setError('That backup is too large.')
      return
    }
    const text = await file.text()
    if (users.length) setPending(text)
    else apply(text)
  }

  function apply(raw: string) {
    const result = importBackup(raw)
    setPending('')
    if (!result.ok) {
      setError(result.error)
      setNotice('')
      return
    }
    setError('')
    setNotice('Backup restored. Your profiles, notes, folders, and wallpaper are back.')
  }

  return (
    <div className="backup-controls">
      <div className="row-gap">
        {showDownload && (
          <button type="button" className="add-btn" onClick={() => downloadBackupFile(exportBackup())}>
            Download backup
          </button>
        )}
        <button type="button" className="text-btn strong" onClick={() => fileRef.current?.click()}>
          {restoreLabel}
        </button>
      </div>
      <input
        ref={fileRef}
        hidden
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          void onFile(file)
        }}
      />
      {pending && (
        <div className="confirm-box">
          <p>Replace everything on this computer with this backup?</p>
          <div className="row-gap">
            <button type="button" className="add-btn" onClick={() => apply(pending)}>
              Replace data
            </button>
            <button type="button" className="text-btn" onClick={() => setPending('')}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && <p className="saved-note">{notice}</p>}
    </div>
  )
}
