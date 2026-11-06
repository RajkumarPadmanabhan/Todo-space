import { IconMoon, IconSun } from './Icons'
import { useTheme } from '../theme'

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useTheme()
  return (
    <div className={className ? `theme-toggle ${className}` : 'theme-toggle'} role="group" aria-label="Appearance">
      <button type="button" aria-label="Light mode" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
        <IconSun />
      </button>
      <button type="button" aria-label="Dark mode" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
        <IconMoon />
      </button>
    </div>
  )
}
