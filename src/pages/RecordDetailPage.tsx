// Record detail page for /evidence/:recordId.
// Wraps RecordDetail with a back link; 404 handled inside RecordDetail.

import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { RecordDetail } from '../components/RecordDetail.tsx';

export function RecordDetailPage() {
  const { recordId } = useParams<{ recordId: string }>();

  if (!recordId) {
    return (
      <main id="main" className="container-page py-8">
        <p className="text-text-muted">No record ID provided.</p>
        <Link to="/evidence" className="mt-2 inline-flex items-center gap-1 text-sm text-brand-orange hover:underline">
          <ChevronLeft size={14} aria-hidden="true" />Back to Evidence
        </Link>
      </main>
    );
  }

  return (
    <main id="main" aria-label={`Record detail: ${recordId}`}>
      <div className="container-page py-8">
        <Link
          to="/evidence"
          className="mb-5 inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          Back to Evidence
        </Link>
        <RecordDetail recordId={recordId} />
      </div>
    </main>
  );
}
