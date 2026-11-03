import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useBeginnerMode } from '../context/BeginnerModeContext.tsx';

interface ExplanationPanelProps {
  title: string;
  technical: string;
  simple: string;
  defaultOpen?: boolean;
}

export function ExplanationPanel({ title, technical, simple, defaultOpen = false }: ExplanationPanelProps) {
  const { enabled } = useBeginnerMode();
  const [open, setOpen] = useState(defaultOpen);
  const content = enabled ? simple : technical;
  return (
    <div className="rounded-lg border border-subtle bg-bg-card">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-text-primary focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
      >
        <span>{title}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-subtle px-4 py-3 text-sm text-text-secondary">
          {content}
        </div>
      )}
    </div>
  );
}
