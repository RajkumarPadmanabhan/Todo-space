import type { ReactNode } from 'react'

type IconProps = { size?: number }

function Svg({ size = 18, children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  )
}

const stroke = { stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function IconSearch() {
  return (
    <Svg>
      <circle cx="11" cy="11" r="6.5" {...stroke} />
      <path d="M16 16.5L20 20.5" {...stroke} />
    </Svg>
  )
}

export function IconBell() {
  return (
    <Svg>
      <path d="M6 16.5h12l-1.2-2.1V10a4.8 4.8 0 10-9.6 0v4.4L6 16.5z" {...stroke} />
      <path d="M10 18.5a2 2 0 004 0" {...stroke} />
    </Svg>
  )
}

export function IconGrid() {
  return (
    <Svg>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.6" {...stroke} />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" {...stroke} />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" {...stroke} />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" {...stroke} />
    </Svg>
  )
}

export function IconCheck() {
  return (
    <Svg>
      <rect x="4" y="4" width="16" height="16" rx="4" {...stroke} />
      <path d="M8 12.2l2.6 2.6L16.2 9" {...stroke} />
    </Svg>
  )
}

export function IconChat() {
  return (
    <Svg>
      <path d="M6 16.5l-1.5 3.5 4-2h7.2A3.3 3.3 0 0019 14.7V8.3A3.3 3.3 0 0015.7 5H8.3A3.3 3.3 0 005 8.3v5.2A3.3 3.3 0 008.3 16.8H6z" {...stroke} />
    </Svg>
  )
}

export function IconUser() {
  return (
    <Svg>
      <circle cx="12" cy="9" r="3.2" {...stroke} />
      <path d="M6.2 18.5a6 6 0 0111.6 0" {...stroke} />
    </Svg>
  )
}

export function IconOut() {
  return (
    <Svg>
      <path d="M10 7V5.8A1.8 1.8 0 0111.8 4h6.4A1.8 1.8 0 0120 5.8v12.4a1.8 1.8 0 01-1.8 1.8h-6.4A1.8 1.8 0 0110 18.2V17" {...stroke} />
      <path d="M4 12h10" {...stroke} />
      <path d="M7 9l-3 3 3 3" {...stroke} />
    </Svg>
  )
}

export function IconLock() {
  return (
    <Svg>
      <rect x="5" y="10" width="14" height="10" rx="2" {...stroke} />
      <path d="M8 10V7.5a4 4 0 018 0V10" {...stroke} />
    </Svg>
  )
}

export function IconFolder() {
  return (
    <Svg>
      <path d="M4 8.2A2.2 2.2 0 016.2 6H10l1.7 2h6.1A2.2 2.2 0 0120 10.2v7.6a2.2 2.2 0 01-2.2 2.2H6.2A2.2 2.2 0 014 17.8V8.2z" {...stroke} />
    </Svg>
  )
}

export function IconInfo() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="M12 11v5" {...stroke} />
      <path d="M12 8h.01" {...stroke} />
    </Svg>
  )
}

export function IconPlus() {
  return (
    <Svg size={16}>
      <path d="M12 5v14M5 12h14" {...stroke} />
    </Svg>
  )
}
