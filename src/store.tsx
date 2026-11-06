import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildBackup, emptyDatabase, parseBackup, sanitizeDatabase, type Database } from './backup'
import { SYSTEM_ID, type Folder, type Message, type PublicUser, type Task, type TaskDraft, type User, type VaultDocument, type Wallpaper } from './types'
import { clampWallpaper, defaultWallpaper, hashPassword } from './utils'

const KEY = 'todey-db-v1'

type RegisterInput = {
  name: string
  email: string
  password: string
  avatar: string
}

type Result = { ok: true; id?: string } | { ok: false; error: string }

type StoreValue = {
  user: PublicUser | null
  users: PublicUser[]
  tasks: Task[]
  allTasks: Task[]
  vaultTasks: Task[]
  documents: VaultDocument[]
  folders: Folder[]
  messages: Message[]
  sentToasts: string[]
  sentDesktop: string[]
  epoch: number
  register: (input: RegisterInput) => Promise<Result>
  login: (email: string, password: string) => Promise<Result>
  logout: () => void
  updateProfile: (patch: { name?: string; avatar?: string; company?: string; position?: string }) => void
  setAppPassword: (current: string, next: string) => Promise<Result>
  setVaultPin: (current: string, next: string) => Promise<Result>
  checkAppPassword: (password: string) => Promise<boolean>
  checkVaultPin: (pin: string) => Promise<boolean>
  updateWallpaper: (patch: Partial<Wallpaper>) => void
  addTask: (draft: TaskDraft, vaulted?: boolean) => void
  vaultTask: (id: string) => void
  unvaultTask: (id: string) => void
  saveDocument: (id: string | null, title: string, body: string) => void
  deleteDocument: (id: string) => void
  updateTask: (id: string, draft: TaskDraft) => void
  deleteTask: (id: string) => void
  restoreTask: (id: string) => void
  toggleTask: (id: string) => void
  moveTask: (id: string, folderId: string | null) => void
  createFolder: (name: string) => Result
  renameFolder: (id: string, name: string) => Result
  deleteFolder: (id: string) => void
  sendMessage: (toId: string, text: string) => void
  markInboxRead: () => void
  markToastSent: (keys: string[]) => void
  markDesktopSent: (keys: string[]) => void
  markTourSeen: () => void
  replayTour: () => void
  deleteAccount: (password: string) => Promise<Result>
  exportBackup: () => ReturnType<typeof buildBackup>
  importBackup: (raw: string) => Result
}

const StoreContext = createContext<StoreValue | null>(null)

function load(): Database {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyDatabase()
    return sanitizeDatabase(JSON.parse(raw) as Partial<Database>)
  } catch {
    return emptyDatabase()
  }
}

function pub(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    wallpaper: user.wallpaper,
    company: user.company,
    position: user.position,
    createdAt: user.createdAt,
    hasAppPassword: Boolean(user.appLockHash),
    hasVaultPin: Boolean(user.vaultPinHash),
    tourSeen: user.tourSeen === true,
  }
}

function lockHash(email: string, secret: string) {
  return hashPassword(`${email}:todey-lock`, secret)
}

function uniqCap(prev: string[], keys: string[]) {
  const next = [...prev]
  for (const key of keys) if (!next.includes(key)) next.push(key)
  return next.slice(-500)
}

function cleanName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(load)
  const [epoch, setEpoch] = useState(0)
  const dbRef = useRef(db)
  dbRef.current = db

  useEffect(() => {
    const save = () => localStorage.setItem(KEY, JSON.stringify(dbRef.current))
    const id = window.setTimeout(save, 150)
    window.addEventListener('pagehide', save)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('pagehide', save)
    }
  }, [db])

  const register = useCallback(async (input: RegisterInput): Promise<Result> => {
    const email = input.email.trim().toLowerCase()
    const name = cleanName(input.name)
    if (!name) return { ok: false, error: 'Add your name.' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email.' }
    if (input.password.length < 6) return { ok: false, error: 'Use at least 6 characters for the password.' }
    if (!input.avatar.startsWith('data:image/')) return { ok: false, error: 'Add a profile photo to continue.' }
    if (dbRef.current.users.some((user) => user.email === email)) {
      return { ok: false, error: 'An account with this email already exists.' }
    }
    const passwordHash = await hashPassword(email, input.password)
    const user: User = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      avatar: input.avatar,
      wallpaper: defaultWallpaper(),
      company: '',
      position: '',
      appLockHash: null,
      vaultPinHash: null,
      tourSeen: false,
      createdAt: Date.now(),
    }
    const welcome: Message = {
      id: crypto.randomUUID(),
      fromId: SYSTEM_ID,
      toId: user.id,
      text: 'Welcome to To-Dey. Your inbox is ready — reply anytime. Tasks due within 24 hours show up under Alerts and on your desktop.',
      createdAt: Date.now(),
      read: false,
    }
    setDb((prev) => ({
      ...prev,
      users: [...prev.users, user],
      messages: [...prev.messages, welcome],
      sessionUserId: user.id,
    }))
    return { ok: true }
  }, [])

  const login = useCallback(async (emailRaw: string, password: string): Promise<Result> => {
    const email = emailRaw.trim().toLowerCase()
    const passwordHash = await hashPassword(email, password)
    const user = dbRef.current.users.find((item) => item.email === email && item.passwordHash === passwordHash)
    if (!user) return { ok: false, error: "That email and password don't match." }
    setDb((prev) => ({ ...prev, sessionUserId: user.id }))
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    setDb((prev) => ({ ...prev, sessionUserId: null }))
  }, [])

  const updateProfile = useCallback((patch: { name?: string; avatar?: string; company?: string; position?: string }) => {
    const id = dbRef.current.sessionUserId
    if (!id) return
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((user) => {
        if (user.id !== id) return user
        const name = patch.name !== undefined ? cleanName(patch.name) : user.name
        const company = patch.company !== undefined ? cleanName(patch.company).slice(0, 80) : user.company
        const position = patch.position !== undefined ? cleanName(patch.position).slice(0, 80) : user.position
        return { ...user, name: name || user.name, avatar: patch.avatar ?? user.avatar, company, position }
      }),
    }))
  }, [])

  const setAppPassword = useCallback(async (current: string, next: string): Promise<Result> => {
    const id = dbRef.current.sessionUserId
    const user = dbRef.current.users.find((item) => item.id === id)
    if (!user) return { ok: false, error: 'Log in first.' }
    if (next.length < 4) return { ok: false, error: 'Use at least 4 characters for the app password.' }
    if (user.appLockHash) {
      const currentHash = await lockHash(user.email, current)
      if (currentHash !== user.appLockHash) return { ok: false, error: "That current app password doesn't match." }
    }
    const nextHash = await lockHash(user.email, next)
    if (user.vaultPinHash && nextHash === user.vaultPinHash) {
      return { ok: false, error: 'The app password and the vault PIN have to be different.' }
    }
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((item) => (item.id === user.id ? { ...item, appLockHash: nextHash } : item)),
    }))
    return { ok: true }
  }, [])

  const setVaultPin = useCallback(async (current: string, next: string): Promise<Result> => {
    const id = dbRef.current.sessionUserId
    const user = dbRef.current.users.find((item) => item.id === id)
    if (!user) return { ok: false, error: 'Log in first.' }
    if (!/^\d{4,8}$/.test(next)) return { ok: false, error: 'Use a 4 to 8 digit PIN for the vault.' }
    if (user.vaultPinHash) {
      const currentHash = await lockHash(user.email, current)
      if (currentHash !== user.vaultPinHash) return { ok: false, error: "That current vault PIN doesn't match." }
    }
    const nextHash = await lockHash(user.email, next)
    if (user.appLockHash && nextHash === user.appLockHash) {
      return { ok: false, error: 'The app password and the vault PIN have to be different.' }
    }
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((item) => (item.id === user.id ? { ...item, vaultPinHash: nextHash } : item)),
    }))
    return { ok: true }
  }, [])

  const checkAppPassword = useCallback(async (password: string) => {
    const id = dbRef.current.sessionUserId
    const user = dbRef.current.users.find((item) => item.id === id)
    if (!user?.appLockHash) return false
    return (await lockHash(user.email, password)) === user.appLockHash
  }, [])

  const checkVaultPin = useCallback(async (pin: string) => {
    const id = dbRef.current.sessionUserId
    const user = dbRef.current.users.find((item) => item.id === id)
    if (!user?.vaultPinHash) return false
    return (await lockHash(user.email, pin)) === user.vaultPinHash
  }, [])

  const updateWallpaper = useCallback((patch: Partial<Wallpaper>) => {
    const id = dbRef.current.sessionUserId
    if (!id) return
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((user) =>
        user.id === id ? { ...user, wallpaper: clampWallpaper({ ...user.wallpaper, ...patch }) } : user,
      ),
    }))
  }, [])

  const addTask = useCallback((draft: TaskDraft, vaulted = false) => {
    const userId = dbRef.current.sessionUserId
    if (!userId) return
    const folderOk = Boolean(
      draft.folderId && dbRef.current.folders.some((folder) => folder.id === draft.folderId && folder.userId === userId),
    )
    const task: Task = {
      id: crypto.randomUUID(),
      userId,
      title: draft.title.trim().slice(0, 80),
      note: draft.note.trim().slice(0, 500),
      date: draft.date,
      time: draft.time,
      color: draft.color,
      done: draft.done,
      folderId: folderOk ? draft.folderId : null,
      deletedAt: null,
      vaulted,
      createdAt: Date.now(),
    }
    setDb((prev) => ({ ...prev, tasks: [...prev.tasks, task] }))
  }, [])

  const updateTask = useCallback((id: string, draft: TaskDraft) => {
    const userId = dbRef.current.sessionUserId
    const folderOk = Boolean(
      draft.folderId && dbRef.current.folders.some((folder) => folder.id === draft.folderId && folder.userId === userId),
    )
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              title: draft.title.trim().slice(0, 80),
              note: draft.note.trim().slice(0, 500),
              date: draft.date,
              time: draft.time,
              color: draft.color,
              done: draft.done,
              folderId: folderOk ? draft.folderId : null,
            }
          : task,
      ),
    }))
  }, [])

  const vaultTask = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === id ? { ...task, vaulted: true } : task)),
    }))
  }, [])

  const unvaultTask = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === id ? { ...task, vaulted: false } : task)),
    }))
  }, [])

  const saveDocument = useCallback((id: string | null, title: string, body: string) => {
    const userId = dbRef.current.sessionUserId
    if (!userId) return
    const cleanTitle = title.trim().slice(0, 120)
    const cleanBody = body.slice(0, 20000)
    if (!cleanTitle && !cleanBody.trim()) return
    setDb((prev) => {
      if (id) {
        return {
          ...prev,
          documents: prev.documents.map((doc) =>
            doc.id === id ? { ...doc, title: cleanTitle || 'Untitled document', body: cleanBody } : doc,
          ),
        }
      }
      const doc: VaultDocument = {
        id: crypto.randomUUID(),
        userId,
        title: cleanTitle || 'Untitled document',
        body: cleanBody,
        createdAt: Date.now(),
      }
      return { ...prev, documents: [...prev.documents, doc] }
    })
  }, [])

  const deleteDocument = useCallback((id: string) => {
    setDb((prev) => ({ ...prev, documents: prev.documents.filter((doc) => doc.id !== id) }))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === id ? { ...task, deletedAt: Date.now() } : task)),
    }))
  }, [])

  const restoreTask = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === id ? { ...task, deletedAt: null } : task)),
    }))
  }, [])

  const toggleTask = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }))
  }, [])

  const moveTask = useCallback((id: string, folderId: string | null) => {
    const userId = dbRef.current.sessionUserId
    const folderOk = Boolean(folderId && dbRef.current.folders.some((folder) => folder.id === folderId && folder.userId === userId))
    setDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === id ? { ...task, folderId: folderOk ? folderId : null } : task)),
    }))
  }, [])

  const createFolder = useCallback((raw: string): Result => {
    const userId = dbRef.current.sessionUserId
    if (!userId) return { ok: false, error: 'Log in first.' }
    const name = cleanName(raw).slice(0, 40)
    if (!name) return { ok: false, error: 'Name the folder.' }
    if (dbRef.current.folders.some((folder) => folder.userId === userId && folder.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: 'You already have a folder with that name.' }
    }
    const folder: Folder = { id: crypto.randomUUID(), userId, name, createdAt: Date.now() }
    setDb((prev) => ({ ...prev, folders: [...prev.folders, folder] }))
    return { ok: true, id: folder.id }
  }, [])

  const renameFolder = useCallback((id: string, raw: string): Result => {
    const userId = dbRef.current.sessionUserId
    if (!userId) return { ok: false, error: 'Log in first.' }
    const name = cleanName(raw).slice(0, 40)
    if (!name) return { ok: false, error: 'Name the folder.' }
    if (
      dbRef.current.folders.some(
        (folder) => folder.userId === userId && folder.id !== id && folder.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return { ok: false, error: 'You already have a folder with that name.' }
    }
    setDb((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) => (folder.id === id ? { ...folder, name } : folder)),
    }))
    return { ok: true }
  }, [])

  const deleteFolder = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      folders: prev.folders.filter((folder) => folder.id !== id),
      tasks: prev.tasks.map((task) => (task.folderId === id ? { ...task, folderId: null } : task)),
    }))
  }, [])

  const sendMessage = useCallback((toId: string, text: string) => {
    const me = dbRef.current.sessionUserId
    const clean = text.trim().slice(0, 1000)
    if (!me || !clean) return
    if (!dbRef.current.users.some((user) => user.id === toId)) return
    const message: Message = {
      id: crypto.randomUUID(),
      fromId: me,
      toId,
      text: clean,
      createdAt: Date.now(),
      read: false,
    }
    setDb((prev) => ({ ...prev, messages: [...prev.messages, message] }))
  }, [])

  const markInboxRead = useCallback(() => {
    setDb((prev) => ({
      ...prev,
      messages: prev.messages.map((message) =>
        message.toId === prev.sessionUserId ? { ...message, read: true } : message,
      ),
    }))
  }, [])

  const markToastSent = useCallback((keys: string[]) => {
    setDb((prev) => ({ ...prev, sentToasts: uniqCap(prev.sentToasts, keys) }))
  }, [])

  const markDesktopSent = useCallback((keys: string[]) => {
    setDb((prev) => ({ ...prev, sentDesktop: uniqCap(prev.sentDesktop, keys) }))
  }, [])

  const exportBackup = useCallback(() => buildBackup(dbRef.current), [])

  const importBackup = useCallback((raw: string): Result => {
    const parsed = parseBackup(raw)
    if (!parsed.ok) return parsed
    setDb(parsed.db)
    setEpoch((value) => value + 1)
    return { ok: true }
  }, [])

  const setTourSeen = useCallback((seen: boolean) => {
    const id = dbRef.current.sessionUserId
    if (!id) return
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((user) => (user.id === id ? { ...user, tourSeen: seen } : user)),
    }))
  }, [])

  const markTourSeen = useCallback(() => setTourSeen(true), [setTourSeen])
  const replayTour = useCallback(() => setTourSeen(false), [setTourSeen])

  const deleteAccount = useCallback(async (password: string): Promise<Result> => {
    const id = dbRef.current.sessionUserId
    const user = dbRef.current.users.find((item) => item.id === id)
    if (!user) return { ok: false, error: 'Log in first.' }
    const passwordHash = await hashPassword(user.email, password)
    if (passwordHash !== user.passwordHash) return { ok: false, error: "That login password doesn’t match." }
    setDb((prev) => ({
      ...prev,
      users: prev.users.filter((item) => item.id !== user.id),
      tasks: prev.tasks.filter((task) => task.userId !== user.id),
      documents: prev.documents.filter((doc) => doc.userId !== user.id),
      folders: prev.folders.filter((folder) => folder.userId !== user.id),
      messages: prev.messages.filter((message) => message.fromId !== user.id && message.toId !== user.id),
      sessionUserId: null,
    }))
    setEpoch((value) => value + 1)
    return { ok: true }
  }, [])

  const value = useMemo<StoreValue>(() => {
    const user = db.users.find((item) => item.id === db.sessionUserId) ?? null
    const id = user?.id
    const mine = id ? db.tasks.filter((task) => task.userId === id) : []
    const visible = mine.filter((task) => !task.vaulted)
    return {
      user: user ? pub(user) : null,
      users: db.users.map(pub),
      tasks: visible.filter((task) => !task.deletedAt),
      allTasks: visible,
      vaultTasks: mine.filter((task) => task.vaulted),
      documents: id ? db.documents.filter((doc) => doc.userId === id) : [],
      folders: id ? db.folders.filter((folder) => folder.userId === id) : [],
      messages: id ? db.messages.filter((message) => message.toId === id || message.fromId === id) : [],
      sentToasts: db.sentToasts,
      sentDesktop: db.sentDesktop,
      epoch,
      register,
      login,
      logout,
      updateProfile,
      updateWallpaper,
      setAppPassword,
      setVaultPin,
      checkAppPassword,
      checkVaultPin,
      addTask,
      vaultTask,
      unvaultTask,
      saveDocument,
      deleteDocument,
      updateTask,
      deleteTask,
      restoreTask,
      toggleTask,
      moveTask,
      createFolder,
      renameFolder,
      deleteFolder,
      sendMessage,
      markInboxRead,
      markToastSent,
      markDesktopSent,
      markTourSeen,
      replayTour,
      deleteAccount,
      exportBackup,
      importBackup,
    }
  }, [
    db,
    epoch,
    register,
    login,
    logout,
    updateProfile,
    updateWallpaper,
    setAppPassword,
    setVaultPin,
    checkAppPassword,
    checkVaultPin,
    addTask,
    vaultTask,
    unvaultTask,
    saveDocument,
    deleteDocument,
    updateTask,
    deleteTask,
    restoreTask,
    toggleTask,
    moveTask,
    createFolder,
    renameFolder,
    deleteFolder,
    sendMessage,
    markInboxRead,
    markToastSent,
    markDesktopSent,
    markTourSeen,
    replayTour,
    deleteAccount,
    exportBackup,
    importBackup,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('Store missing')
  return value
}
