import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Avatar } from '../components/Avatar'
import { SYSTEM_ID, type Message, type PublicUser } from '../types'
import { formatRelative } from '../utils'
import { useStore } from '../store'

export function Inbox({ now, search }: { now: Date; search: string }) {
  const { user, users, messages, sendMessage, markInboxRead } = useStore()
  const [toId, setToId] = useState(user?.id ?? '')
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    markInboxRead()
  }, [markInboxRead])

  const people = useMemo(() => {
    const map = new Map<string, PublicUser>()
    for (const person of users) map.set(person.id, person)
    return map
  }, [users])

  if (!user) return null

  const query = search.trim().toLowerCase()
  const feed = messages
    .filter((message) => {
      if (!query) return true
      const sender = senderOf(message, people)
      return message.text.toLowerCase().includes(query) || sender.name.toLowerCase().includes(query)
    })
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)

  function send(event: FormEvent) {
    event.preventDefault()
    if (!text.trim() || !toId) return
    sendMessage(toId, text)
    setText('')
  }

  function sendReply(event: FormEvent, message: Message) {
    event.preventDefault()
    const recipient = message.fromId === user?.id ? message.toId : message.fromId
    if (recipient === SYSTEM_ID || !replyText.trim()) return
    sendMessage(recipient, replyText)
    setReplyText('')
    setReplyTo(null)
  }

  return (
    <div className="inbox-wrap">
      <section className="activity" aria-label="Activity">
        <div className="activity-head">
          <h2>Activity</h2>
        </div>
        <form className="composer" onSubmit={send}>
          <div className="composer-title">New message</div>
          <select value={toId} onChange={(event) => setToId(event.target.value)} aria-label="Recipient">
            {users.map((person) => (
              <option key={person.id} value={person.id}>
                {person.id === user.id ? `${person.name} (you)` : person.name}
              </option>
            ))}
          </select>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a message"
            rows={2}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <button className="send-btn" type="submit">
            Send
          </button>
        </form>
        {feed.length === 0 && <p className="activity-empty">No messages yet.</p>}
        {feed.map((message) => {
          const sender = senderOf(message, people)
          const canReply = message.fromId !== SYSTEM_ID
          return (
            <article key={message.id} className="activity-card">
              <Avatar src={sender.avatar} name={sender.name} size={42} />
              <div>
                <div className="msg-top">
                  <span className="msg-name">{sender.name}</span>
                  <span className="msg-time">{formatRelative(message.createdAt, now)}</span>
                </div>
                <p className="msg-text">{message.text}</p>
                {canReply && (
                  <button
                    type="button"
                    className="reply-btn"
                    onClick={() => {
                      setReplyTo((current) => (current === message.id ? null : message.id))
                      setReplyText('')
                    }}
                  >
                    Reply
                  </button>
                )}
                {replyTo === message.id && (
                  <form
                    className="reply-box"
                    onSubmit={(event) => sendReply(event, message)}
                  >
                    <textarea
                      autoFocus
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder="Write a reply"
                      rows={2}
                    />
                    <button className="send-btn" type="submit">
                      Reply
                    </button>
                  </form>
                )}
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}

function senderOf(message: Message, people: Map<string, PublicUser>): { name: string; avatar?: string } {
  if (message.fromId === SYSTEM_ID) return { name: 'To-Dey' }
  const person = people.get(message.fromId)
  return { name: person?.name ?? 'Someone', avatar: person?.avatar }
}
