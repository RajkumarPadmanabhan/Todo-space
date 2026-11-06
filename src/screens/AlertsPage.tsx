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
      <p className="muted alerts-intro">These notes are due within 24 hours. Each one alerts a day before, on the day, an hour before, and when it is due. The same alerts reach your desktop when alerts are on.</p>
      <AlertList tasks={tasks} now={now} onEdit={onEdit} />
    </section>
  )
}
