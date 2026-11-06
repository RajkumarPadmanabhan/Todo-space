import { initials } from '../utils'

export function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) }
  if (src) return <img className="avatar" style={style} src={src} alt="" />
  return (
    <span className="avatar avatar-fallback" style={style} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
