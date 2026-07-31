import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/theme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-elevated hover:text-ink"
      aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
    >
      {theme === 'light' ? (
        <Moon size={18} strokeWidth={2} />
      ) : (
        <Sun size={18} strokeWidth={2} />
      )}
    </button>
  )
}
