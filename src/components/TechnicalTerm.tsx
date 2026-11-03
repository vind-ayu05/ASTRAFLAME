import type { ReactNode } from 'react';
import { useBeginnerMode } from '../context/BeginnerModeContext.tsx';
import { ScientificTooltip } from './ScientificTooltip.tsx';

interface TechnicalTermProps {
  term: string;
  definition: string;
  children: ReactNode;
}

export function TechnicalTerm({ term, definition, children }: TechnicalTermProps) {
  const { enabled } = useBeginnerMode();
  if (!enabled) return <>{children}</>;
  return (
    <ScientificTooltip term={term} definition={definition}>
      {children}
    </ScientificTooltip>
  );
}
