// ChatMessage — renders a single chat turn.
// Supports markdown-like bold (**text**), bullet lists, and evidence record chips.
// Never uses colour as the sole signal for status.

import { AlertTriangle, BookOpen, FlaskConical, User } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from './chatEngine.ts';

interface ChatMessageProps {
  message: ChatMessageType;
}

/** Very lightweight markdown renderer — only bold and newlines. */
function renderContent(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    // Bold: **text**
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((part, pi) =>
      pi % 2 === 1
        ? <strong key={pi} className="font-semibold text-[#F4F2EE]">{part}</strong>
        : <span key={pi}>{part}</span>
    );
    return <span key={li} className="block">{rendered}</span>;
  });
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isRefusal = message.isRefusal;

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 px-3 py-1">
        <div
          className="max-w-[82%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm"
          style={{
            background: '#FF6B2C',
            color: '#090B0E',
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          {message.content}
        </div>
        <span
          className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: '#1E232A', border: '1px solid rgba(116,122,132,0.3)' }}
          aria-hidden="true"
        >
          <User size={14} color="#A4A7AD" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 px-3 py-1">
      {/* Avatar */}
      <span
        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{
          background: 'linear-gradient(135deg, #FF6B2C, #C84000)',
          boxShadow: '0 0 8px rgba(255,107,44,0.3)',
        }}
        aria-hidden="true"
      >
        <FlaskConical size={13} color="#fff" />
      </span>

      <div className="min-w-0 flex-1">
        {/* Refusal styling */}
        {isRefusal ? (
          <div
            className="rounded-xl px-3.5 py-2.5 text-sm"
            style={{
              background: 'rgba(255,107,44,0.08)',
              border: '1px solid rgba(255,107,44,0.25)',
              color: '#A4A7AD',
              lineHeight: 1.6,
            }}
            role="alert"
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              <AlertTriangle size={13} color="#FF913D" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#FF913D' }}>
                Cannot answer
              </span>
            </div>
            <div className="space-y-0.5 text-xs" style={{ color: '#A4A7AD' }}>
              {renderContent(message.content)}
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl rounded-bl-sm px-3.5 py-2.5 text-xs"
            style={{
              background: '#171B21',
              border: '1px solid rgba(116,122,132,0.2)',
              color: '#A4A7AD',
              lineHeight: 1.65,
            }}
          >
            <div className="space-y-0.5">
              {renderContent(message.content)}
            </div>

            {/* Evidence records */}
            {message.evidenceRecords && message.evidenceRecords.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {message.evidenceRecords.slice(0, 4).map((r) => (
                  <span
                    key={r.record_id}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px]"
                    style={{
                      background: 'rgba(255,107,44,0.1)',
                      border: '1px solid rgba(255,107,44,0.2)',
                      color: '#FF913D',
                    }}
                    title={`${r.material_type} · ${r.investigation} · ${r.review_status}`}
                  >
                    <BookOpen size={9} aria-hidden="true" />
                    {r.record_id}
                    {r.review_status === 'draft' && (
                      <span style={{ color: '#747A84', marginLeft: 2 }}>draft</span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Limitations */}
            {message.limitations && (
              <p
                className="mt-2 text-[10px] italic"
                style={{
                  color: '#747A84',
                  borderTop: '1px solid rgba(116,122,132,0.15)',
                  paddingTop: 6,
                }}
              >
                {message.limitations}
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="mt-0.5 block px-1 text-[10px]" style={{ color: '#747A84' }}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
