import { useStore } from '../store'

export function FolderMark({ folderId }: { folderId: string | null }) {
  const { folders } = useStore()
  const folder = folders.find((item) => item.id === folderId)
  if (!folder) return null
  return <span className="folder-pill">{folder.name}</span>
}
