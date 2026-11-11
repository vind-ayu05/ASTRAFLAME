// FloatingChatButton — fixed bottom-right circular launcher.
// Uses the exact Satellite02Icon SVG. Shows tooltip "Ask ASTRAFLAME AI".
// Manages open/minimized state and renders the ChatWindow above it.

import { useState, useEffect, useRef } from 'react';
import { Satellite02Icon } from './Satellite02Icon.tsx';
import { ChatWindow } from './ChatWindow.tsx';

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pulse, setPulse] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Stop the pulse ring after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 4000);
    return () => clearTimeout(t);
  }, []);

  function handleOpen() {
    if (isOpen && !isMinimized) {
      // Second click while open = minimize
      setIsMinimized(true);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
      setPulse(false);
    }
    setShowTooltip(false);
  }

  function handleClose() {
    setIsOpen(false);
    setIsMinimized(false);
    // Return focus to button
    setTimeout(() => buttonRef.current?.focus(), 50);
  }

  function handleMinimize() {
    setIsMinimized(true);
  }

  return (
    <>
      {/* Chat window — mounted once open, hidden when minimized */}
      <ChatWindow
        isOpen={isOpen}
        isMinimized={isMinimized}
        onMinimize={handleMinimize}
        onClose={handleClose}
      />

      {/* Floating button */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 20,
          zIndex: 9001,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 0,
        }}
      >
        {/* Tooltip */}
        {showTooltip && !isOpen && (
          <div
            role="tooltip"
            style={{
              marginBottom: 8,
              padding: '5px 10px',
              borderRadius: 8,
              background: '#1E232A',
              border: '1px solid rgba(116,122,132,0.3)',
              color: '#F4F2EE',
              fontSize: 12,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
              animation: 'chatFadeIn 0.15s ease',
            }}
          >
            Ask ASTRAFLAME AI
          </div>
        )}

        {/* Pulse ring (attention animation on first render) */}
        {pulse && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              border: '2px solid rgba(255,107,44,0.5)',
              animation: 'chatPulseRing 1.4s cubic-bezier(0.4,0,0.6,1) infinite',
            }}
          />
        )}

        {/* Minimized badge — shows unread dot when minimized */}
        {isOpen && isMinimized && (
          <span
            aria-label="Chat minimized"
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#FF6B2C',
              border: '2px solid #090B0E',
              zIndex: 1,
            }}
          />
        )}

        {/* Main button */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpen}
          onMouseEnter={() => {
            setShowTooltip(true);
            if (buttonRef.current) buttonRef.current.style.boxShadow =
              '0 6px 24px rgba(255,107,44,0.65), 0 1px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
          }}
          onMouseLeave={() => {
            setShowTooltip(false);
            if (buttonRef.current) buttonRef.current.style.boxShadow =
              '0 4px 16px rgba(255,107,44,0.45), 0 1px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
          }}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          aria-label="Ask ASTRAFLAME AI"
          aria-expanded={isOpen && !isMinimized}
          aria-haspopup="dialog"
          style={{
            position: 'relative',
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF7A38 0%, #FF6B2C 50%, #E05A1E 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow:
              '0 4px 16px rgba(255,107,44,0.45), 0 1px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            transition: 'transform 0.15s cubic-bezier(0.22,1,0.36,1), box-shadow 0.15s',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
            setTimeout(() => {
              if (e.currentTarget) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }, 150);
          }}
        >
          <Satellite02Icon size={27} color="#FFFFFF" />
        </button>
      </div>

      {/* Global keyframe animations */}
      <style>{`
        @keyframes chatPulseRing {
          0%   { opacity: 0.9; transform: scale(1); }
          70%  { opacity: 0;   transform: scale(1.5); }
          100% { opacity: 0;   transform: scale(1.5); }
        }
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
