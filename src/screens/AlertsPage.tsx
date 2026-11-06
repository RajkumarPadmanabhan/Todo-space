import { AlertList } from '../components/AlertList'
import type { Task } from '../types'

export function AlertsPage({
  tasks,
  now,
  onEdit,
}: {
  tasks: Task[]
  now: Date
  onEdit: (task: Task) => void
}) {
  return (
    <section className="panel alerts-panel">
      <p className="muted alerts-intro">These notes are due within 24 hours. To-Dey also sends each one to your desktop when alerts are on.</p>
      <AlertList tasks={tasks} now={now} onEdit={onEdit} />
    </section>
  )
}
