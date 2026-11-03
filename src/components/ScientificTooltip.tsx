import { useId, useState } from 'react';
import type { ReactNode } from 'react';

interface ScientificTooltipProps {
  term: string;
  definition: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
}

export function ScientificTooltip({ term, definition, children, side = 'top' }: ScientificTooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      data-side={side}
    >
      <span
        tabIndex={0}
        role="button"
        aria-describedby={id}
        className="cursor-help border-b border-dotted border-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
      >
        {children}
      </span>
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={`pointer-events-none absolute z-50 w-56 rounded-lg border border-subtle bg-bg-card p-3 text-xs text-text-secondary shadow-lg ${
            side === 'top' ? 'bottom-full left-1/2 mb-1.5 -translate-x-1/2' : 'left-1/2 top-full mt-1.5 -translate-x-1/2'
          }`}
        >
          <span className="block font-semibold text-text-primary">{term}</span>
          <span>{definition}</span>
        </span>
      )}
    </span>
  );
}
