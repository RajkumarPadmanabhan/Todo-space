import { useEffect, useRef, useState } from 'react'

const VIEW = 280
const SIZE = 320

type Props = {
  file: File
  onCancel: () => void
  onConfirm: (dataUrl: string) => void
}

export function CropModal({ file, onCancel, onConfirm }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [url, setUrl] = useState('')
  const [broken, setBroken] = useState(false)
  const [meta, setMeta] = useState<{ w: number; h: number } | null>(null)
  const [base, setBase] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef({ zoom, offset, base, meta })
  stateRef.current = { zoom, offset, base, meta }

  useEffect(() => {
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const current = stateRef.current
      if (!current.meta) return
      const direction = event.deltaY < 0 ? 1 : -1
      const next = clampZoom(current.zoom + direction * 0.08)
      const prevScale = current.base * current.zoom
      const nextScale = current.base * next
      const center = VIEW / 2
      const ix = (center - current.offset.x) / prevScale
      const iy = (center - current.offset.y) / prevScale
      setZoom(next)
      setOffset(clampOffset(center - ix * nextScale, center - iy * nextScale, current.meta, current.base, next))
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [url])

  function coverLayout(image: HTMLImageElement) {
    const nextBase = Math.max(VIEW / image.naturalWidth, VIEW / image.naturalHeight)
    const width = image.naturalWidth * nextBase
    const height = image.naturalHeight * nextBase
    setBase(nextBase)
    setZoom(1)
    setMeta({ w: image.naturalWidth, h: image.naturalHeight })
    setOffset({ x: (VIEW - width) / 2, y: (VIEW - height) / 2 })
  }

  function changeZoom(next: number) {
    if (!meta) return
    const clamped = clampZoom(next)
    const prevScale = base * zoom
    const nextScale = base * clamped
    const center = VIEW / 2
    const ix = (center - offset.x) / prevScale
    const iy = (center - offset.y) / prevScale
    const nx = center - ix * nextScale
    const ny = center - iy * nextScale
    setZoom(clamped)
    setOffset(clampOffset(nx, ny, meta, base, clamped))
  }

  function confirmCrop() {
    const image = imgRef.current
    if (!image || !meta) return
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scale = base * zoom
    let sx = Math.max(0, -offset.x / scale)
    let sy = Math.max(0, -offset.y / scale)
    let sw = Math.min(image.naturalWidth - sx, VIEW / scale)
    let sh = Math.min(image.naturalHeight - sy, VIEW / scale)
    if (sw <= 0 || sh <= 0) return
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.save()
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, SIZE, SIZE)
    ctx.restore()
    onConfirm(canvas.toDataURL('image/png'))
  }

  const displayW = meta ? meta.w * base * zoom : 0
  const displayH = meta ? meta.h * base * zoom : 0

  return (
    <div className="overlay" role="presentation" onMouseDown={onCancel}>
      <div
        className="modal crop-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="crop-title">Crop your photo</h2>
        <p className="muted crop-help">Drag to reposition. Scroll or use the slider to zoom. The circle is your profile photo.</p>
        {broken ? (
          <p className="form-error" role="alert">
            This photo couldn't be opened. Try a JPG or PNG.
          </p>
        ) : (
          <div
            className="crop-stage"
            ref={stageRef}
            onPointerDown={(event) => {
              drag.current = { x: event.clientX, y: event.clientY }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (!drag.current || !meta) return
              const dx = event.clientX - drag.current.x
              const dy = event.clientY - drag.current.y
              drag.current = { x: event.clientX, y: event.clientY }
              setOffset((current) => clampOffset(current.x + dx, current.y + dy, meta, base, zoom))
            }}
            onPointerUp={() => {
              drag.current = null
            }}
          >
            {url && (
              <img
                ref={imgRef}
                src={url}
                alt=""
                draggable={false}
                onLoad={(event) => coverLayout(event.currentTarget)}
                onError={() => setBroken(true)}
                style={{ width: displayW, height: displayH, left: offset.x, top: offset.y }}
              />
            )}
            <div className="crop-shade" />
          </div>
        )}
        <label className="field">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            disabled={!meta}
            onChange={(event) => changeZoom(Number(event.target.value))}
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="text-btn" onClick={onCancel}>
            Cancel
          </button>
          <div className="row-gap">
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                const image = imgRef.current
                if (image) coverLayout(image)
              }}
            >
              Reset
            </button>
            <button type="button" className="add-btn" disabled={!meta || broken} onClick={confirmCrop}>
              Save crop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function clampZoom(value: number) {
  return Math.min(3, Math.max(1, value))
}

function clampOffset(
  x: number,
  y: number,
  meta: { w: number; h: number },
  base: number,
  zoom: number,
) {
  const width = meta.w * base * zoom
  const height = meta.h * base * zoom
  return {
    x: Math.min(0, Math.max(VIEW - width, x)),
    y: Math.min(0, Math.max(VIEW - height, y)),
  }
}
