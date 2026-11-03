// LunarGravityNotice: shown when scenario uses lunar or mars gravity.
// Informs the user that NASA PSI flight data covers microgravity only;
// lunar/Martian evidence is Tier 2 literature.
import { AlertTriangle } from 'lucide-react';
import type { GravityCategory } from '../types/index.ts';

interface LunarGravityNoticeProps {
  gravityCategory: GravityCategory;
}

export function LunarGravityNotice({ gravityCategory }: LunarGravityNoticeProps) {
  if (gravityCategory !== 'lunar' && gravityCategory !== 'mars') return null;
  const label = gravityCategory === 'lunar' ? 'Lunar' : 'Martian';
  return (
    <aside
      role="note"
      className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" aria-hidden="true" />
      <p>
        Microgravity is not equivalent to {label} gravity. NASA PSI flight data covers microgravity.
        {' '}{label} evidence comes from Tier 2 literature only.
      </p>
    </aside>
  );
}
