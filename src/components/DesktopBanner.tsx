import { useState } from 'react'
import { requestDesktopPermission } from '../utils'

export function DesktopBanner({ onGranted }: { onGranted: () => void }) {
  const supported = typeof Notification !== 'undefined'
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(supported ? Notification.permission : 'unsupported')
  const [hidden, setHidden] = useState(false)

  if (hidden || perm === 'granted') return null

  async function enable() {
    const result = await requestDesktopPermission()
    setPerm(result === 'unsupported' ? 'unsupported' : result)
    if (result === 'granted') onGranted()
  }

  const blocked = perm === 'denied'
  const unsupported = perm === 'unsupported'

  return (
    <div className="desk-banner">
      <p>
        {unsupported
          ? 'This browser cannot show desktop alerts. To-Dey will still notify you inside the app.'
          : blocked
            ? 'Desktop alerts are blocked in the browser settings. To-Dey will still notify you inside the app.'
            : 'Turn on desktop alerts so a task due within 24 hours can reach you outside To-Dey.'}
      </p>
      <div className="row-gap">
        {!blocked && !unsupported && (
          <button type="button" className="light-btn" onClick={() => void enable()}>
            Enable desktop alerts
          </button>
        )}
        <button type="button" className="ghost-btn" onClick={() => setHidden(true)}>
          Not now
        </button>
      </div>
    </div>
  )
}
