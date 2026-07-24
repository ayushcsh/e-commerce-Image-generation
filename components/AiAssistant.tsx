"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content: "Hi! I'm the VendorFlow assistant. Ask me anything about how it works, pricing, or your account.",
};

const MAX_HISTORY_SENT = 10;

function BotAvatar() {
  return (
    <span className="aiAssistantAvatar" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="8" width="14" height="11" rx="4" />
        <line x1="12" y1="8" x2="12" y2="4" />
        <circle cx="12" cy="3" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="9" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="15" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
        <path d="M9.5 16.5c.8.6 1.7.9 2.5.9s1.7-.3 2.5-.9" />
      </svg>
    </span>
  );
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-MAX_HISTORY_SENT) }),
      });
      const data = await res.json();
      if (!res.ok || typeof data.reply !== "string") {
        throw new Error(data?.error || "Something went wrong.");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="aiAssistant" aria-live="polite">
      {open && (
        <div className="aiAssistantPanel" role="dialog" aria-label="VendorFlow assistant">
          <div className="aiAssistantHeader">
            <span className="aiAssistantHeaderTitle">
              <BotAvatar />
              VendorFlow Assistant
            </span>
            <button
              type="button"
              className="aiAssistantClose"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              ✕
            </button>
          </div>

          <div className="aiAssistantMessages" ref={listRef}>
            {messages.map((m, i) =>
              m.role === "assistant" ? (
                <div key={i} className="aiAssistantRow">
                  <BotAvatar />
                  <div className="aiAssistantBubble aiAssistantBubbleBot">{m.content}</div>
                </div>
              ) : (
                <div key={i} className="aiAssistantBubble aiAssistantBubbleUser">
                  {m.content}
                </div>
              )
            )}
            {sending && (
              <div className="aiAssistantRow">
                <BotAvatar />
                <div className="aiAssistantBubble aiAssistantBubbleBot aiAssistantTyping">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            {error && <div className="aiAssistantError">{error}</div>}
          </div>

          <div className="aiAssistantInputRow">
            <textarea
              className="aiAssistantInput"
              placeholder="Ask about VendorFlow..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              type="button"
              className="aiAssistantSend"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="aiAssistantFab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open VendorFlow assistant"}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <Image src="/logo.png" alt="" width={26} height={24} className="aiAssistantFabLogo" />
        )}
      </button>
    </div>
  );
}
