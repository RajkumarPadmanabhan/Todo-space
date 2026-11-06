import { useEffect, useState } from 'react'
import { AuthScreen } from './screens/AuthScreen'
import { AppLock } from './screens/AppLock'
import { Shell } from './screens/Shell'
import { StoreProvider, useStore } from './store'
import { cx, wallpaperFilter } from './utils'

export function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  )
}

function Root() {
  const { user } = useStore()
  const [now, setNow] = useState(() => new Date())
  const [unlockedFor, setUnlockedFor] = useState<string | null>(null)
  const [skippedFor, setSkippedFor] = useState<string | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const wall = user?.wallpaper
  const hasImage = Boolean(wall?.image)
  const needsUnlock = Boolean(user?.hasAppPassword && unlockedFor !== user?.id)
  const needsSetup = Boolean(user && !user.hasAppPassword && skippedFor !== user.id)
  return (
    <div className={cx('app-frame', hasImage && 'has-wallpaper')}>
      {hasImage && wall && (
        <>
          <div className="wallpaper-layer" style={{ backgroundImage: `url("${wall.image}")`, filter: wallpaperFilter(wall) }} />
          <div className="wallpaper-dim" style={{ opacity: wall.dim / 100 }} />
        </>
      )}
      {!user && <AuthScreen />}
      {user && needsUnlock && <AppLock mode="unlock" onUnlocked={() => setUnlockedFor(user.id)} />}
      {user && needsSetup && (
        <AppLock mode="create" onUnlocked={() => setUnlockedFor(user.id)} onSkip={() => setSkippedFor(user.id)} />
      )}
      {user && !needsUnlock && !needsSetup && <Shell now={now} />}
    </div>
  )
}
