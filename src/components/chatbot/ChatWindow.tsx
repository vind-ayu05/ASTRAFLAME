// ChatWindow — floating ASTRAFLAME AI chat panel.
// Opens above the FloatingChatButton, animated slide-in.
// Scientific integrity rules enforced in chatEngine.ts.

import { useEffect, useRef, useState } from 'react';
import { Minus, X } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from './chatEngine.ts';
import { processQuestion, makeSystemMessage, SUGGESTED_CHAT_QUESTIONS } from './chatEngine.ts';
import { ChatMessage } from './ChatMessage.tsx';
import { ChatInput } from './ChatInput.tsx';

interface ChatWindowProps {
  isOpen: boolean;
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}

function LoadingDots() {
  return (
    <div className="flex gap-2 px-3 py-1">
      <span
        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'linear-gradient(135deg, #FF6B2C, #C84000)' }}
        aria-hidden="true"
      >
        <span className="block h-2 w-2 rounded-full bg-white opacity-80" />
      </span>
      <div
        className="rounded-xl rounded-bl-sm px-3.5 py-3"
        style={{ background: '#171B21', border: '1px solid rgba(116,122,132,0.2)' }}
        aria-label="Assistant is thinking"
      >
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full"
              style={{
                background: '#FF6B2C',
                animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

export function ChatWindow({ isOpen, isMinimized, onMinimize, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>(() => [makeSystemMessage()]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (!isMinimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isMinimized]);

  async function handleSend() {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: ChatMessageType = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content: q,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await processQuestion(q, messages);
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          role: 'assistant' as const,
          content: 'Something went wrong. Please try again.',
          timestamp: new Date(),
          isRefusal: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestedQuestion(q: string) {
    setInput(q);
    // Small delay so the input renders, then send
    setTimeout(async () => {
      const userMsg: ChatMessageType = {
        id: Math.random().toString(36).slice(2),
        role: 'user',
        content: q,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      try {
        const response = await processQuestion(q, messages);
        setMessages((prev) => [...prev, response]);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 60);
  }

  const showSuggestions = messages.length <= 1 && !loading;

  if (!isOpen) return null;

  return (
    <>
      {/* Inject loading dot animation */}
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40%            { opacity: 1;    transform: scale(1.15); }
        }
      `}</style>

      <div
        role="dialog"
        aria-label="ASTRAFLAME AI chat"
        aria-modal="false"
        style={{
          position: 'fixed',
          bottom: isMinimized ? 'auto' : 88,
          right: 20,
          width: 'clamp(320px, 92vw, 400px)',
          maxHeight: isMinimized ? 0 : 'min(580px, calc(100dvh - 110px))',
          height: isMinimized ? 0 : undefined,
          overflow: 'hidden',
          borderRadius: 16,
          background: '#111419',
          border: '1px solid rgba(116,122,132,0.22)',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,107,44,0.08), 0 0 24px rgba(255,107,44,0.06)',
          zIndex: 9000,
          display: 'flex',
          flexDirection: 'column',
          transition: 'max-height 0.25s cubic-bezier(0.22,1,0.36,1), opacity 0.2s',
          opacity: isMinimized ? 0 : 1,
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderBottom: '1px solid rgba(116,122,132,0.18)',
            background: '#0D1117',
            flexShrink: 0,
          }}
        >
          {/* Logo mark */}
          <img
            src="/astraflame-logo.svg"
            alt="ASTRAFLAME"
            style={{ width: 110, height: 'auto', objectFit: 'contain', flexShrink: 0 }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#F4F2EE', letterSpacing: '0.01em' }}>
              ASTRAFLAME AI
            </p>
            <p style={{ margin: 0, fontSize: 10, color: '#747A84', letterSpacing: '0.04em' }}>
              Spacecraft Fire Research Assistant
            </p>
          </div>

          {/* Online indicator */}
          <span
            title="Evidence engine active"
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#4D9A97',
              boxShadow: '0 0 5px rgba(77,154,151,0.7)',
              flexShrink: 0,
            }}
            aria-label="Online"
          />

          {/* Minimize */}
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize chat"
            style={{
              width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(116,122,132,0.25)',
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#747A84',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1E232A'; (e.currentTarget as HTMLButtonElement).style.color = '#F4F2EE'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#747A84'; }}
          >
            <Minus size={13} aria-hidden="true" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            style={{
              width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(116,122,132,0.25)',
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#747A84',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,107,44,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#FF6B2C'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#747A84'; }}
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>

        {/* ── Messages ────────────────────────────────────────────────── */}
        <div
          style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 4 }}
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {loading && <LoadingDots />}

          {/* Suggested questions — shown only on first load */}
          {showSuggestions && (
            <div style={{ padding: '8px 12px 4px' }}>
              <p style={{ fontSize: 10, color: '#747A84', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Suggested questions
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {SUGGESTED_CHAT_QUESTIONS.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSuggestedQuestion(q)}
                    style={{
                      textAlign: 'left', fontSize: 11, padding: '6px 10px',
                      borderRadius: 8, border: '1px solid rgba(116,122,132,0.22)',
                      background: '#171B21', color: '#A4A7AD', cursor: 'pointer',
                      transition: 'border-color 0.15s, color 0.15s',
                      lineHeight: 1.4,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,107,44,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = '#F4F2EE'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(116,122,132,0.22)'; (e.currentTarget as HTMLButtonElement).style.color = '#A4A7AD'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Disclaimer strip ────────────────────────────────────────── */}
        <p
          style={{
            margin: 0, padding: '4px 12px 0',
            fontSize: 9, color: '#747A84', textAlign: 'center', flexShrink: 0,
            borderTop: '1px solid rgba(116,122,132,0.12)',
          }}
        >
          Spacecraft fire evidence platform · Evidence-based research assistant
        </p>

        {/* ── Input ───────────────────────────────────────────────────── */}
        <div ref={inputAreaRef} style={{ flexShrink: 0 }}>
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={loading}
          />
        </div>
      </div>
    </>
  );
}
