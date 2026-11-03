// Theme toggle.
//
// A button that switches the active theme via useTheme. aria-pressed reflects
// the current theme (pressed = light is on) and the aria-label describes the
// destination state. :focus-visible is styled globally in index.css.

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isLight}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      title={isLight ? 'Dark theme' : 'Light theme'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-subtle bg-bg-card text-text-secondary transition-colors hover:text-text-primary"
    >
      {isLight ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
    </button>
  );
}
