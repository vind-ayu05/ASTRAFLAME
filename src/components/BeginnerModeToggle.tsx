// Beginner-mode toggle.
//
// A button toggling useBeginnerMode with a visible "Beginner mode" label and an
// aria-pressed state. Keyboard accessible; :focus-visible is styled globally.

import { useBeginnerMode } from '../context/BeginnerModeContext.tsx';

export function BeginnerModeToggle() {
  const { enabled, toggle } = useBeginnerMode();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label="Beginner mode"
      title="Beginner mode"
      className="inline-flex items-center gap-2 rounded-lg border border-subtle bg-bg-card px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-5 w-9 items-center rounded-full border border-subtle transition-colors ${
          enabled ? 'bg-brand-orange' : 'bg-bg-elevated'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-text-primary shadow transition-transform ${
            enabled ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </span>
      <span>Beginner mode</span>
    </button>
  );
}
