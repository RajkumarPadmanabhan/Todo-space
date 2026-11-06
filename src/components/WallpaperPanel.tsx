import { useRef, useState } from 'react'
import { useStore } from '../store'
import { readImageFile, wallpaperFilter } from '../utils'

export function WallpaperPanel() {
  const { user, updateWallpaper } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  if (!user) return null
  const wall = user.wallpaper

  async function onFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Use a background smaller than 12 MB.')
      return
    }
    try {
      const image = await readImageFile(file, 1400, 0.82)
      updateWallpaper({ image })
      setError('')
    } catch {
      setError('That image could not be used. Try a JPG or PNG.')
    }
  }

  return (
    <section className="panel wallpaper-panel">
      <div className="panel-head">
        <h2>Wallpaper</h2>
        {wall.image && (
          <button
            type="button"
            className="text-btn"
            onClick={() => updateWallpaper({ image: '', blur: 0, saturation: 100, brightness: 100, dim: 28 })}
          >
            Reset
          </button>
        )}
      </div>
      <p className="muted">The photo sits behind To-Dey. Blur softens it, and saturation makes the color stronger.</p>
      <div className="wallpaper-row">
        <div
          className="wallpaper-preview"
          style={
            wall.image
              ? { backgroundImage: `url(${wall.image})`, filter: wallpaperFilter(wall) }
              : undefined
          }
        >
          <span style={{ opacity: wall.image ? wall.dim / 100 : 0 }} />
          {!wall.image && <em>No photo yet</em>}
        </div>
        <div className="wallpaper-controls">
          <button type="button" className="add-btn" onClick={() => fileRef.current?.click()}>
            {wall.image ? 'Change photo' : 'Upload background'}
          </button>
          <input
            ref={fileRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void onFile(file)
            }}
          />
          <Slider label="Blur" value={wall.blur} min={0} max={24} step={1} suffix="px" disabled={!wall.image} onChange={(blur) => updateWallpaper({ blur })} />
          <Slider
            label="Saturation"
            value={wall.saturation}
            min={100}
            max={220}
            step={1}
            suffix="%"
            disabled={!wall.image}
            onChange={(saturation) => updateWallpaper({ saturation })}
          />
          <Slider
            label="Brightness"
            value={wall.brightness}
            min={70}
            max={140}
            step={1}
            suffix="%"
            disabled={!wall.image}
            onChange={(brightness) => updateWallpaper({ brightness })}
          />
          <Slider label="Dim" value={wall.dim} min={0} max={70} step={1} suffix="%" disabled={!wall.image} onChange={(dim) => updateWallpaper({ dim })} />
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  disabled,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix: string
  disabled: boolean
  onChange: (value: number) => void
}) {
  return (
    <label className="slider-field">
      <span>
        {label}
        <strong>
          {Math.round(value)}
          {suffix}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}
