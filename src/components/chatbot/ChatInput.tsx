// ChatInput — message input with Enter-to-send and Shift+Enter for newline.

import { useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { ArrowUp } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ value, onChange, onSend, disabled, placeholder }: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <div
      className="flex items-end gap-2 px-3 pb-3 pt-2"
      style={{ borderTop: '1px solid rgba(116,122,132,0.18)' }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKey}
        disabled={disabled}
        placeholder={placeholder ?? 'Ask about spacecraft fire evidence…'}
        rows={1}
        aria-label="Chat message"
        style={{
          flex: 1,
          resize: 'none',
          background: '#1E232A',
          border: '1px solid rgba(116,122,132,0.25)',
          borderRadius: 10,
          padding: '8px 12px',
          fontSize: 13,
          color: '#F4F2EE',
          lineHeight: 1.5,
          outline: 'none',
          minHeight: 36,
          maxHeight: 120,
          overflowY: 'auto',
          fontFamily: 'Inter, sans-serif',
        }}
        className="placeholder-[#747A84] focus-visible:border-[#FF6B2C]"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: disabled || !value.trim() ? '#1E232A' : '#FF6B2C',
          border: '1px solid',
          borderColor: disabled || !value.trim() ? 'rgba(116,122,132,0.25)' : '#FF6B2C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
          flexShrink: 0,
        }}
      >
        <ArrowUp size={16} color={disabled || !value.trim() ? '#747A84' : '#090B0E'} aria-hidden="true" />
      </button>
    </div>
  );
}
