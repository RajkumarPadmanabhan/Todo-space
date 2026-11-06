// To-Dey local server.
//
// Serves the built app from dist/ and keeps the alert schedule the app hands it, so that system
// notifications still go out after the To-Dey window is closed. While a window is open the app
// alerts on its own and this process stays quiet.
//
//   npm start            serve on http://127.0.0.1:5173
//   PORT=5174 npm start  another port (the Vite dev server proxies /api here)

import http from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const stateFile = path.join(root, '.todey-alerts.json')

const PORT = Number(process.env.PORT) || 5173
const TICK = 10_000 // how often pending alerts are checked
const CLIENT_TIMEOUT = 30_000 // no sync for this long means the window is closed
const GRACE = 15 * 60_000 // an alert older than this is skipped, not shown late
const MAX_FIRED = 1000

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const state = loadState()
let lastSeen = 0

function loadState() {
  try {
    const parsed = JSON.parse(readFileSync(stateFile, 'utf8'))
    return {
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts.filter(isAlert) : [],
      fired: Array.isArray(parsed.fired) ? parsed.fired.filter((key) => typeof key === 'string') : [],
    }
  } catch {
    return { alerts: [], fired: [] }
  }
}

function saveState() {
  try {
    writeFileSync(stateFile, JSON.stringify(state))
  } catch (error) {
    console.error('[to-dey] could not save alert state:', error.message)
  }
}

function isAlert(value) {
  return (
    value &&
    typeof value.key === 'string' &&
    typeof value.at === 'number' &&
    Number.isFinite(value.at) &&
    typeof value.title === 'string' &&
    typeof value.body === 'string'
  )
}

function readBody(req, limit = 2_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(payload))
}

async function handleSync(req, res) {
  let parsed
  try {
    parsed = JSON.parse((await readBody(req)) || '{}')
  } catch {
    sendJson(res, 400, { error: 'bad json' })
    return
  }
  const alerts = Array.isArray(parsed.alerts) ? parsed.alerts.filter(isAlert).slice(0, 5000) : []
  state.alerts = alerts.map(({ key, stage, at, title, body }) => ({ key, stage, at, title: title.slice(0, 200), body: body.slice(0, 200) }))
  // Alerts the window itself already showed count as fired here too.
  const delivered = Array.isArray(parsed.delivered) ? parsed.delivered.filter((key) => typeof key === 'string').slice(0, 5000) : []
  if (delivered.some((key) => !state.fired.includes(key))) state.fired = [...new Set([...state.fired, ...delivered])].slice(-MAX_FIRED)
  lastSeen = Date.now()
  saveState()
  sendJson(res, 200, { fired: state.fired })
}

function serveStatic(url, res) {
  let file = path.normalize(path.join(dist, decodeURIComponent(url.pathname)))
  if (!file.startsWith(dist)) {
    res.writeHead(403)
    res.end()
    return
  }
  if (!existsSync(file) || statSync(file).isDirectory()) file = path.join(dist, 'index.html')
  if (!existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Run "npm run build" first.')
    return
  }
  const ext = path.extname(file)
  const immutable = file.includes(`${path.sep}assets${path.sep}`)
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  createReadStream(file).pipe(res)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost')
  if (url.pathname === '/api/sync' && req.method === 'POST') {
    handleSync(req, res).catch(() => sendJson(res, 500, { error: 'sync failed' }))
    return
  }
  if (url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, windowOpen: Date.now() - lastSeen < CLIENT_TIMEOUT, pending: state.alerts.length })
    return
  }
  if (url.pathname.startsWith('/api/')) {
    sendJson(res, 404, { error: 'not found' })
    return
  }
  serveStatic(url, res)
})

/* ---------- background alerts ---------- */

function tick() {
  if (Date.now() - lastSeen < CLIENT_TIMEOUT) return // the window is open and alerts on its own
  const now = Date.now()
  const byTask = new Map()
  for (const alert of state.alerts) {
    if (alert.at > now || state.fired.includes(alert.key)) continue
    const taskKey = alert.key.slice(0, alert.key.lastIndexOf('|'))
    const list = byTask.get(taskKey) || []
    list.push(alert)
    byTask.set(taskKey, list)
  }
  if (byTask.size === 0) return

  const newlyFired = []
  for (const list of byTask.values()) {
    list.sort((a, b) => a.at - b.at)
    const latest = list[list.length - 1]
    if (now - latest.at <= GRACE) notify(latest.title, latest.body)
    // Earlier stages of the same task are superseded either way.
    newlyFired.push(...list.map((alert) => alert.key))
  }
  state.fired = [...new Set([...state.fired, ...newlyFired])].slice(-MAX_FIRED)
  saveState()
}

function notify(title, body) {
  console.log(`[to-dey] alert: ${title} — ${body}`)
  if (process.platform === 'win32') notifyWindows(title, body)
  else if (process.platform === 'darwin') notifyMac(title, body)
}

function escapeXml(text) {
  return text.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char])
}

function notifyWindows(title, body) {
  // A toast through the Windows Runtime. PowerShell's own app id is registered on every Windows 10/11
  // machine, so the toast shows without installing anything.
  const xml = `<toast><visual><binding template="ToastGeneric"><text>${escapeXml(title)}</text><text>${escapeXml(body)}</text></binding></visual></toast>`
  const script = [
    '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null',
    '[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null',
    '$xml = New-Object Windows.Data.Xml.Dom.XmlDocument',
    '$xml.LoadXml($env:TODEY_TOAST)',
    '$toast = New-Object Windows.UI.Notifications.ToastNotification $xml',
    "[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe').Show($toast)",
  ].join('; ')
  spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], {
    env: { ...process.env, TODEY_TOAST: xml },
    stdio: 'ignore',
    windowsHide: true,
  }).on('error', (error) => console.error('[to-dey] toast failed:', error.message))
}

function notifyMac(title, body) {
  const quote = (text) => `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  spawn('osascript', ['-e', `display notification ${quote(body)} with title ${quote(title)}`], { stdio: 'ignore' }).on('error', (error) =>
    console.error('[to-dey] notification failed:', error.message),
  )
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[to-dey] serving ${existsSync(dist) ? 'dist/' : '(no build yet)'} on http://127.0.0.1:${PORT}`)
  console.log(`[to-dey] ${state.alerts.length} scheduled alert(s) loaded; background alerts run while the window is closed`)
})
setInterval(tick, TICK)
