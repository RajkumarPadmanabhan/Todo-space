import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertList } from '../components/AlertList'
import { Avatar } from '../components/Avatar'
import { DesktopBanner } from '../components/DesktopBanner'
import { IconBell, IconChat, IconCheck, IconFolder, IconGrid, IconInfo, IconLock, IconOut, IconSearch, IconUser } from '../components/Icons'
import { Walkthrough, type TourStep } from '../components/Walkthrough'
import { TaskModal } from '../components/TaskModal'
import { ThemeToggle } from '../components/ThemeToggle'
import type { Page, Task, TaskDraft } from '../types'
import { useStore } from '../store'
import { useAlerts } from '../useAlerts'
import { useAlertSync } from '../useAlertSync'
import { compareTasks, cx, dateKey, defaultTime, isWithin24h, taskDue } from '../utils'
import { AboutPage } from './AboutPage'
import { AlertsPage } from './AlertsPage'
import { Dashboard } from './Dashboard'
import { FoldersPage } from './FoldersPage'
import { Inbox } from './Inbox'
import { ProfilePage } from './ProfilePage'
import { Todos } from './Todos'
import { VaultPage } from './VaultPage'

type ModalState = { type: 'create'; date?: string; folderId?: string | null } | { type: 'edit'; task: Task } | null

const TITLES: Record<Exclude<Page, 'dashboard'>, string> = {
  todos: 'Todos',
  folders: 'Folders',
  vault: 'Vault',
  inbox: 'Inbox',
  alerts: 'Alerts',
  about: 'About',
  profile: 'Profile',
}

const TOUR: TourStep[] = [
  { page: 'dashboard', target: 'tour-dashboard', title: 'Dashboard', body: 'Opens the home screen. Your week sits on the calendar here.' },
  { page: 'dashboard', target: 'tour-calendar', title: 'Calendar', body: 'Each column is a day. The clock keeps moving, and a line marks the current time.' },
  { page: 'dashboard', target: 'tour-add', title: 'Add a note', body: 'Creates a note on a day. Under the note, To-Dey shows how many days and hours are left.' },
  { page: 'todos', target: 'tour-todos', title: 'Todos', body: 'Every note in one list. Open a note to edit it, finish it, or delete it.' },
  { page: 'folders', target: 'tour-folders', title: 'Folders', body: 'Make your own folder and put notes in it. Each month also files notes into Upcoming, Past, and Deleted.' },
  { page: 'vault', target: 'tour-vault', title: 'Vault', body: 'A private place for notes and documents. It opens with its own 4 to 8 digit PIN, not the app password.' },
  { page: 'inbox', target: 'tour-inbox', title: 'Inbox', body: 'Messages between profiles saved on this computer.' },
  { page: 'alerts', target: 'tour-alerts', title: 'Alerts', body: 'Notes due within 24 hours. Each note alerts a day before, on the day, an hour before, and when it is due. After you allow it, the same alerts reach the desktop.' },
  { page: null, target: 'tour-bell', title: 'Bell', body: 'A short list of those 24-hour notes, without leaving the page you are on.' },
  { page: null, target: 'tour-search', title: 'Search', body: 'Finds a note by what you typed. On Inbox, it searches messages instead.' },
  { page: null, target: 'tour-profile', title: 'Profile', body: 'Your photo, position, and company. Open it to change them, set passwords, pick a wallpaper, or save a backup.' },
  { page: 'about', target: 'tour-about', title: 'About', body: 'How To-Dey works, where each password is used, how a backup restores the app, and how to delete an account.' },
]

export function Shell({ now }: { now: Date }) {
  const {
    user,
    tasks,
    folders,
    messages,
    epoch,
    sentToasts,
    sentDesktop,
    logout,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    markToastSent,
    markDesktopSent,
    markTourSeen,
  } = useStore()
  const [page, setPage] = useState<Page>('dashboard')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [bellOpen, setBellOpen] = useState(false)
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([])
  const [alertTick, setAlertTick] = useState(0)
  const [vaultOpen, setVaultOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const pushToast = useCallback((text: string) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, text }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 6500)
  }, [])

  const dueSoon = tasks
    .filter((task) => !task.done && isWithin24h(taskDue(task), now))
    .slice()
    .sort(compareTasks)
  const unread = user ? messages.filter((message) => message.toId === user.id && !message.read).length : 0

  const alertsReady = useAlertSync({ userId: user?.id ?? null, tasks, sentToasts, sentDesktop, markToastSent, markDesktopSent })

  useAlerts({
    userId: user?.id ?? null,
    enabled: alertsReady,
    tasks,
    sentToasts,
    sentDesktop,
    minute: Math.floor(now.getTime() / 60000),
    tick: alertTick,
    markToastSent,
    markDesktopSent,
    pushToast,
  })

  useEffect(() => {
    document.title = dueSoon.length ? `(${dueSoon.length}) To-Dey` : 'To-Dey'
  }, [dueSoon.length])

  useEffect(() => {
    setVaultOpen(false)
  }, [epoch, user?.id])

  const goPage = useCallback((next: Page) => setPage(next), [])

  useEffect(() => {
    if (!bellOpen) return
    const onDoc = (event: MouseEvent) => {
      if (!bellRef.current?.contains(event.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [bellOpen])

  if (!user) return null

  function openCreate(date?: string, folderId?: string | null) {
    setModal({ type: 'create', date: date ?? dateKey(now), folderId: folderId ?? null })
  }

  function handleSave(draft: TaskDraft, id?: string) {
    if (id) updateTask(id, draft)
    else addTask(draft)
    setModal(null)
    setAlertTick((value) => value + 1)
  }

  const nav: { id: Page; label: string; icon: ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconGrid /> },
    { id: 'todos', label: 'Todos', icon: <IconCheck /> },
    { id: 'folders', label: 'Folders', icon: <IconFolder /> },
    { id: 'vault', label: 'Vault', icon: <IconLock /> },
    { id: 'inbox', label: 'Inbox', icon: <IconChat />, badge: unread },
    { id: 'alerts', label: 'Alerts', icon: <IconBell />, badge: dueSoon.length },
    { id: 'about', label: 'About', icon: <IconInfo /> },
  ]

  return (
    <div className="app">
      <aside className="sidebar">
        <button type="button" className="brand" onClick={() => setPage('dashboard')}>
          <span className="brand-mark">To-Dey</span>
          <span className="brand-name">v1</span>
        </button>
        <div className="nav-label">General</div>
        <nav className="nav">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cx('nav-btn', page === item.id && 'active')}
              data-tour={`tour-${item.id}`}
              aria-current={page === item.id ? 'page' : undefined}
              onClick={() => setPage(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {!!item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button type="button" className="side-card" data-tour="tour-profile" onClick={() => setPage('profile')}>
            <Avatar src={user.avatar} name={user.name} size={42} />
            <span>
              <strong>{user.name}</strong>
              <small>{user.position || 'Add a position'}</small>
              <small>{user.company || 'Add a company'}</small>
            </span>
          </button>
          <button type="button" className={cx('nav-btn', page === 'profile' && 'active')} onClick={() => setPage('profile')}>
            <IconUser />
            <span>Profile</span>
          </button>
          <button type="button" className="nav-btn" onClick={logout}>
            <IconOut />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <label className="search" data-tour="tour-search">
            <IconSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={page === 'inbox' ? 'Search messages' : 'Search notes'}
              aria-label={page === 'inbox' ? 'Search messages' : 'Search notes'}
            />
          </label>
          <div className="top-actions">
            <ThemeToggle />
            <div className="bell-wrap" ref={bellRef} data-tour="tour-bell">
              <button
                type="button"
                className="icon-btn"
                aria-label="Notifications"
                aria-expanded={bellOpen}
                onClick={() => setBellOpen((open) => !open)}
              >
                <IconBell />
                {dueSoon.length > 0 && <span className="dot" />}
              </button>
              {bellOpen && (
                <div className="bell-pop">
                  <div className="bell-pop-head">Within 24 hours</div>
                  <AlertList
                    compact
                    tasks={dueSoon}
                    now={now}
                    onEdit={(task) => {
                      setBellOpen(false)
                      setModal({ type: 'edit', task })
                    }}
                  />
                  <button
                    type="button"
                    className="text-btn strong"
                    onClick={() => {
                      setBellOpen(false)
                      setPage('alerts')
                    }}
                  >
                    Open alerts
                  </button>
                </div>
              )}
            </div>
            <button type="button" className="avatar-btn" onClick={() => setPage('profile')} aria-label="Profile">
              <Avatar src={user.avatar} name={user.name} size={42} />
            </button>
          </div>
        </header>
        <DesktopBanner onGranted={() => setAlertTick((value) => value + 1)} />
        {page !== 'inbox' && (
          <div className="page-head">
            <h1 className="greeting">
              {page === 'dashboard' ? (
                <>
                  Stay <em>up to date,</em> {user.name}
                </>
              ) : (
                TITLES[page]
              )}
            </h1>
            {(page === 'dashboard' || page === 'todos') && (
              <button type="button" className="add-btn" data-tour="tour-add" onClick={() => openCreate()}>
                Add task
              </button>
            )}
          </div>
        )}
        <div className={cx('content', page === 'inbox' && 'bleed')}>
          {page === 'dashboard' && (
            <Dashboard tasks={tasks} now={now} search={search} onEdit={(task) => setModal({ type: 'edit', task })} onToggle={toggleTask} onCreate={openCreate} />
          )}
          {page === 'todos' && (
            <Todos tasks={tasks} now={now} search={search} onEdit={(task) => setModal({ type: 'edit', task })} onToggle={toggleTask} />
          )}
          {page === 'vault' && (
            <VaultPage
              now={now}
              open={vaultOpen}
              onOpen={() => setVaultOpen(true)}
              onLock={() => setVaultOpen(false)}
              onEdit={(task) => setModal({ type: 'edit', task })}
            />
          )}
          {page === 'folders' && (
            <FoldersPage
              key={epoch}
              now={now}
              search={search}
              onEdit={(task) => setModal({ type: 'edit', task })}
              onToggle={toggleTask}
              onCreate={openCreate}
            />
          )}
          {page === 'inbox' && <Inbox now={now} search={search} />}
          {page === 'alerts' && (
            <AlertsPage tasks={dueSoon} now={now} onEdit={(task) => setModal({ type: 'edit', task })} />
          )}
          {page === 'about' && <AboutPage />}
          {page === 'profile' && <ProfilePage key={`${user.id}-${epoch}`} />}
        </div>
      </div>
      {modal && (
        <TaskModal
          key={modal.type === 'edit' ? modal.task.id : `new-${modal.date ?? ''}-${modal.folderId ?? ''}`}
          initial={modal.type === 'edit' ? modal.task : undefined}
          presetDate={modal.type === 'create' ? modal.date : undefined}
          presetFolderId={modal.type === 'create' ? modal.folderId : undefined}
          folders={folders}
          presetTime={defaultTime(now)}
          now={now}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={
            modal.type === 'edit'
              ? () => {
                  const id = modal.type === 'edit' ? modal.task.id : ''
                  if (id) deleteTask(id)
                  setModal(null)
                }
              : undefined
          }
        />
      )}
      {user && !user.tourSeen && <Walkthrough steps={TOUR} onPage={goPage} onDone={markTourSeen} />}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            className="toast"
            onClick={() => {
              setPage('alerts')
              setToasts((current) => current.filter((item) => item.id !== toast.id))
            }}
          >
            <strong>{toast.text}</strong>
            <small>Inside To-Dey</small>
          </button>
        ))}
      </div>
    </div>
  )
}
