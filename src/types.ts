export const SYSTEM_ID = 'system'

export type TaskColor = 'yellow' | 'pink' | 'lavender' | 'blue' | 'mint'

export type Wallpaper = {
  image: string
  blur: number
  saturation: number
  brightness: number
  dim: number
}

export type User = {
  id: string
  name: string
  email: string
  passwordHash: string
  appLockHash: string | null
  vaultPinHash: string | null
  avatar: string
  wallpaper: Wallpaper
  company: string
  position: string
  tourSeen: boolean
  createdAt: number
}

export type PublicUser = Omit<User, 'passwordHash' | 'appLockHash' | 'vaultPinHash'> & {
  hasAppPassword: boolean
  hasVaultPin: boolean
}

export type Task = {
  id: string
  userId: string
  title: string
  note: string
  date: string
  time: string
  color: TaskColor
  done: boolean
  folderId: string | null
  deletedAt: number | null
  vaulted: boolean
  createdAt: number
}

export type VaultDocument = {
  id: string
  userId: string
  title: string
  body: string
  createdAt: number
}

export type Folder = {
  id: string
  userId: string
  name: string
  createdAt: number
}

export type MonthCategory = 'upcoming' | 'past' | 'deleted'

export type Message = {
  id: string
  fromId: string
  toId: string
  text: string
  createdAt: number
  read: boolean
}

export type Page = 'dashboard' | 'todos' | 'folders' | 'vault' | 'inbox' | 'alerts' | 'about' | 'profile'

export type TaskDraft = {
  title: string
  note: string
  date: string
  time: string
  color: TaskColor
  done: boolean
  folderId: string | null
}
