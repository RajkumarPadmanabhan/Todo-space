import type { Folder, Message, Task, TaskColor, User, VaultDocument } from './types'
import { clampWallpaper, defaultWallpaper } from './utils'

export type Database = {
  version: 2
  users: User[]
  tasks: Task[]
  documents: VaultDocument[]
  messages: Message[]
  folders: Folder[]
  sessionUserId: string | null
  sentToasts: string[]
  sentDesktop: string[]
}

export type BackupFile = Database & {
  app: 'To-Dey'
  exportedAt: string
}

const COLORS: TaskColor[] = ['yellow', 'pink', 'lavender', 'blue', 'mint']

export function emptyDatabase(): Database {
  return {
    version: 2,
    users: [],
    tasks: [],
    documents: [],
    messages: [],
    folders: [],
    sessionUserId: null,
    sentToasts: [],
    sentDesktop: [],
  }
}

export function sanitizeDatabase(parsed: Partial<Database> | null | undefined): Database {
  const users = asArray(parsed?.users).map(asUser).filter((item): item is User => item !== null)
  const userIds = new Set(users.map((user) => user.id))
  const folders = asArray(parsed?.folders)
    .map(asFolder)
    .filter((item): item is Folder => item !== null && userIds.has(item.userId))
  const folderIds = new Set(folders.map((folder) => folder.id))
  const tasks = asArray(parsed?.tasks)
    .map(asTask)
    .filter((item): item is Task => item !== null && userIds.has(item.userId))
    .map((task) => (task.folderId && folderIds.has(task.folderId) ? task : { ...task, folderId: null }))
  const documents = asArray(parsed?.documents)
    .map(asDocument)
    .filter((item): item is VaultDocument => item !== null && userIds.has(item.userId))
  const messages = asArray(parsed?.messages)
    .map(asMessage)
    .filter((item): item is Message => item !== null)
  const sessionUserId = typeof parsed?.sessionUserId === 'string' && userIds.has(parsed.sessionUserId) ? parsed.sessionUserId : null
  return {
    version: 2,
    users,
    tasks,
    documents,
    messages,
    folders,
    sessionUserId,
    sentToasts: asStrings(parsed?.sentToasts),
    sentDesktop: asStrings(parsed?.sentDesktop),
  }
}

export function buildBackup(db: Database): BackupFile {
  return {
    app: 'To-Dey',
    exportedAt: new Date().toISOString(),
    ...db,
    version: 2,
  }
}

export function parseBackup(raw: string): { ok: true; db: Database } | { ok: false; error: string } {
  if (raw.length > 30 * 1024 * 1024) return { ok: false, error: 'That backup is too large.' }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return { ok: false, error: 'That file isn’t valid JSON.' }
  }
  if (!parsed || typeof parsed !== 'object' || (parsed as { app?: string }).app !== 'To-Dey') {
    return { ok: false, error: 'This file isn’t a To-Dey backup.' }
  }
  const db = sanitizeDatabase(parsed as Partial<Database>)
  if (!db.users.length) return { ok: false, error: 'This backup has no profiles.' }
  return { ok: true, db }
}

export function downloadBackupFile(data: BackupFile) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `to-dey-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asStrings(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').slice(-500)
}

function asUser(value: unknown): User | null {
  if (!value || typeof value !== 'object') return null
  const user = value as Partial<User>
  if (typeof user.id !== 'string' || typeof user.email !== 'string' || typeof user.passwordHash !== 'string') return null
  if (typeof user.name !== 'string' || typeof user.avatar !== 'string') return null
  return {
    id: user.id,
    name: user.name.slice(0, 60),
    email: user.email.trim().toLowerCase(),
    passwordHash: user.passwordHash,
    avatar: user.avatar,
    wallpaper: user.wallpaper ? clampWallpaper(user.wallpaper) : defaultWallpaper(),
    company: typeof user.company === 'string' ? user.company.trim().slice(0, 80) : '',
    position: typeof user.position === 'string' ? user.position.trim().slice(0, 80) : '',
    appLockHash: typeof user.appLockHash === 'string' ? user.appLockHash : null,
    vaultPinHash: typeof user.vaultPinHash === 'string' ? user.vaultPinHash : null,
    tourSeen: user.tourSeen === true,
    createdAt: typeof user.createdAt === 'number' ? user.createdAt : Date.now(),
  }
}

function asFolder(value: unknown): Folder | null {
  if (!value || typeof value !== 'object') return null
  const folder = value as Partial<Folder>
  if (typeof folder.id !== 'string' || typeof folder.userId !== 'string' || typeof folder.name !== 'string') return null
  const name = folder.name.trim().replace(/\s+/g, ' ').slice(0, 40)
  if (!name) return null
  return {
    id: folder.id,
    userId: folder.userId,
    name,
    createdAt: typeof folder.createdAt === 'number' ? folder.createdAt : Date.now(),
  }
}

function asTask(value: unknown): Task | null {
  if (!value || typeof value !== 'object') return null
  const task = value as Partial<Task>
  if (typeof task.id !== 'string' || typeof task.userId !== 'string' || typeof task.title !== 'string') return null
  if (typeof task.date !== 'string' || typeof task.time !== 'string') return null
  return {
    id: task.id,
    userId: task.userId,
    title: task.title.trim().slice(0, 80),
    note: typeof task.note === 'string' ? task.note.trim().slice(0, 500) : '',
    date: task.date,
    time: task.time,
    color: COLORS.includes(task.color as TaskColor) ? (task.color as TaskColor) : 'yellow',
    done: Boolean(task.done),
    folderId: typeof task.folderId === 'string' ? task.folderId : null,
    deletedAt: typeof task.deletedAt === 'number' ? task.deletedAt : null,
    vaulted: Boolean(task.vaulted),
    createdAt: typeof task.createdAt === 'number' ? task.createdAt : Date.now(),
  }
}

function asDocument(value: unknown): VaultDocument | null {
  if (!value || typeof value !== 'object') return null
  const doc = value as Partial<VaultDocument>
  if (typeof doc.id !== 'string' || typeof doc.userId !== 'string' || typeof doc.title !== 'string') return null
  return {
    id: doc.id,
    userId: doc.userId,
    title: doc.title.trim().slice(0, 120) || 'Untitled document',
    body: typeof doc.body === 'string' ? doc.body.slice(0, 20000) : '',
    createdAt: typeof doc.createdAt === 'number' ? doc.createdAt : Date.now(),
  }
}

function asMessage(value: unknown): Message | null {
  if (!value || typeof value !== 'object') return null
  const message = value as Partial<Message>
  if (typeof message.id !== 'string' || typeof message.fromId !== 'string' || typeof message.toId !== 'string') return null
  if (typeof message.text !== 'string') return null
  return {
    id: message.id,
    fromId: message.fromId,
    toId: message.toId,
    text: message.text.slice(0, 1000),
    createdAt: typeof message.createdAt === 'number' ? message.createdAt : Date.now(),
    read: Boolean(message.read),
  }
}
