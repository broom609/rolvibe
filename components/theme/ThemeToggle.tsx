'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'rolvibe-theme'

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  window.localStorage.setItem(STORAGE_KEY, theme)
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
    setTheme(currentTheme)
  }, [])

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  const isLight = theme === 'light'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-secondary)] shadow-sm hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]',
        className
      )}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}
