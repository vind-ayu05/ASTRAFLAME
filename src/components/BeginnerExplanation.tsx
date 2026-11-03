// BeginnerExplanation: renders technical or simple text based on BeginnerMode context.
// Both modes preserve all scientific values, citations, and units.
import { useBeginnerMode } from '../context/BeginnerModeContext.tsx';

interface BeginnerExplanationProps {
  technical: string;
  simple: string;
}

export function BeginnerExplanation({ technical, simple }: BeginnerExplanationProps) {
  const { enabled } = useBeginnerMode();
  return <span>{enabled ? simple : technical}</span>;
}
