import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'todey-theme'

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function storedTheme(): Theme | null {
  const value = localStorage.getItem(KEY)
  return value === 'light' || value === 'dark' ? value : null
}

function apply(theme: Theme | null) {
  const root = document.documentElement
  if (theme) root.setAttribute('data-theme', theme)
  else root.removeAttribute('data-theme')
}

/** Light or dark. A saved choice wins; otherwise the app follows the system. */
export function useTheme(): [Theme, (next: Theme) => void] {
  const [choice, setChoice] = useState<Theme | null>(() => storedTheme())
  const [system, setSystem] = useState<Theme>(() => systemTheme())

  useEffect(() => {
    apply(choice)
  }, [choice])

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystem(systemTheme())
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(KEY, next)
    setChoice(next)
  }, [])

  return [choice ?? system, setTheme]
}

/** Runs before React mounts so the first paint already has the saved theme. */
export function applySavedTheme() {
  apply(storedTheme())
}
