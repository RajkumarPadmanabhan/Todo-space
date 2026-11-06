import { useEffect, useState } from 'react'
import type { Page } from '../types'

export type TourStep = {
  page: Page | null
  target: string
  title: string
  body: string
}

type Box = {
  hole: { top: number; left: number; width: number; height: number }
  top: number
  left: number
  side: 'top' | 'bottom' | 'left' | 'right'
  arrowX: number
  arrowY: number
}

const CARD_H = 210

function place(rect: DOMRect, el: Element): Box {
  const gap = 16
  const vw = window.innerWidth
  const vh = window.innerHeight
  const CARD_W = Math.min(320, vw - 24)
  const choices = [
    { side: 'right' as const, room: vw - rect.right, fits: vw - rect.right > CARD_W + gap },
    { side: 'left' as const, room: rect.left, fits: rect.left > CARD_W + gap },
    { side: 'bottom' as const, room: vh - rect.bottom, fits: vh - rect.bottom > CARD_H + gap },
    { side: 'top' as const, room: rect.top, fits: rect.top > CARD_H + gap },
  ]
  const fitting = choices.filter((choice) => choice.fits).sort((a, b) => b.room - a.room)
  const side = (fitting[0] ?? [...choices].sort((a, b) => b.room - a.room)[0]).side
  let top = rect.bottom + gap
  let left = rect.left + rect.width / 2 - CARD_W / 2
  if (side === 'top') top = rect.top - gap - CARD_H
  if (side === 'right') {
    left = rect.right + gap
    top = rect.top + rect.height / 2 - CARD_H / 2
  }
  if (side === 'left') {
    left = rect.left - gap - CARD_W
    top = rect.top + rect.height / 2 - CARD_H / 2
  }
  const sidebar = document.querySelector('.sidebar')
  if (sidebar?.contains(el) && side === 'right') {
    left = sidebar.getBoundingClientRect().right + gap
    const head = document.querySelector('.page-head')?.getBoundingClientRect().bottom ?? 0
    const bar = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0
    const days = document.querySelector('.day-head')?.getBoundingClientRect().bottom ?? 0
    const floor = Math.max(head, bar, days) + 8
    if (top < floor) top = floor
  }
  if (left < rect.right && left + CARD_W > rect.left && top < rect.bottom && top + CARD_H > rect.top) {
    top = rect.bottom + gap
  }
  left = Math.max(12, Math.min(left, vw - CARD_W - 12))
  top = Math.max(12, Math.min(top, vh - CARD_H - 12))
  return {
    hole: {
      top: Math.max(8, rect.top - 6),
      left: Math.max(8, rect.left - 6),
      width: rect.width + 12,
      height: rect.height + 12,
    },
    top,
    left,
    side,
    arrowX: Math.max(22, Math.min(rect.left + rect.width / 2 - left, CARD_W - 22)),
    arrowY: Math.max(22, Math.min(rect.top + rect.height / 2 - top, CARD_H - 22)),
  }
}

export function Walkthrough({
  steps,
  onPage,
  onDone,
}: {
  steps: TourStep[]
  onPage: (page: Page) => void
  onDone: () => void
}) {
  const [index, setIndex] = useState(0)
  const [box, setBox] = useState<Box | null>(null)
  const step = steps[index]

  useEffect(() => {
    if (step?.page) onPage(step.page)
  }, [step, onPage])

  useEffect(() => {
    const stepNow = steps[index]
    if (!stepNow) return
    let frame = 0
    let tries = 0
    const measure = () => {
      const el = document.querySelector(`[data-tour="${stepNow.target}"]`)
      if (!el) {
        if (tries++ < 40) frame = window.requestAnimationFrame(measure)
        return
      }
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      setBox(place(el.getBoundingClientRect(), el))
    }
    frame = window.requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [index, steps])

  if (!step) return null
  const last = index === steps.length - 1

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {box && <div className="tour-hole" style={box.hole} />}
      <div
        className="tour-card"
        data-side={box?.side ?? 'bottom'}
        style={box ? { top: box.top, left: box.left, ['--arrow-x' as string]: `${box.arrowX}px`, ['--arrow-y' as string]: `${box.arrowY}px` } : { top: 24, left: 24 }}
      >
        <span className="tour-arrow" />
        <p className="tour-count">
          {index + 1} of {steps.length}
        </p>
        <h2 id="tour-title">{step.title}</h2>
        <p>{step.body}</p>
        <div className="tour-actions">
          <button type="button" className="text-btn" onClick={onDone}>
            Skip
          </button>
          <span className="tour-nav">
            {index > 0 && (
              <button type="button" className="text-btn strong" onClick={() => setIndex((value) => value - 1)}>
                Back
              </button>
            )}
            <button type="button" className="add-btn" onClick={() => (last ? onDone() : setIndex((value) => value + 1))}>
              {last ? 'Done' : 'Next'}
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
