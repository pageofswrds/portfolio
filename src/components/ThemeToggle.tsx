import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const icon = theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'

  return (
    <button
      onClick={cycleTheme}
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        padding: '0.5rem 0.75rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--bd-primary)',
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        fontSize: '1rem',
        zIndex: 100,
      }}
      title={`Theme: ${theme}`}
    >
      {icon}
    </button>
  )
}
