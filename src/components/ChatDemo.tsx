"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { VerdictPill } from "@/components/primitives";
import { IconBook, IconRefresh, IconSend, IconWaves, IconX } from "@/components/icons";
import type { SourceRef, Verdict } from "@/lib/saathi";
import { answerQuestionClient, KB_ENTRIES, type ClientKbEntry } from "@/lib/saathi-client";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  verdict?: Verdict;
  sources?: SourceRef[];
}

type KbEntry = ClientKbEntry;

const SUGGESTIONS = [
  "Can we bathe near Gaughat?",
  "What does Category E mean?",
  "Is foam near Nishatganj dangerous?",
  "Nishatganj ke paas nahana safe hai?",
  "Does rain make the river safe?",
];

function getSession(): string {
  if (typeof window === "undefined") return "";
  let s = window.localStorage.getItem("saathi-session");
  if (!s) {
    s = crypto.randomUUID();
    window.localStorage.setItem("saathi-session", s);
  }
  return s;
}

export function ChatDemo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showKb, setShowKb] = useState(false);
  const [kb, setKb] = useState<{ total: number; chunks: KbEntry[] } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Load the local static knowledge base when opened. GitHub Pages has no server API. */
  useEffect(() => {
    if (!open || hydrated) return;
    setMessages([]);
    setKb({ total: KB_ENTRIES.length, chunks: KB_ENTRIES });
    setHydrated(true);
  }, [open, hydrated]);

  /* Autoscroll */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, showKb]);

  const send = useCallback(async (raw: string) => {
    const message = raw.trim();
    if (!message) return;
    setInput("");
    setBusy(true);
    const tempId = `u-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content: message }]);

    try {
      await new Promise((resolve) => setTimeout(resolve, 280));
      const answer = answerQuestionClient(message);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: answer.text,
          verdict: answer.verdict,
          sources: answer.sources,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "Sorry — the local demo could not generate an answer.",
          verdict: "info",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const newSession = () => {
    const s = crypto.randomUUID();
    window.localStorage.setItem("saathi-session", s);
    setMessages([]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Gomti Saathi live demo">
      <button className="fade-anim absolute inset-0 bg-ink/40" onClick={onClose} aria-label="Close demo" />
      <div className="drawer-anim relative flex h-full w-full max-w-[460px] flex-col border-l border-ink/15 bg-paper shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-ink/10 bg-river-950 px-4 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-river-600 text-cream">
            <IconWaves className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-extrabold text-cream">Gomti Saathi — live demo</p>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-river-300">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-river-300" aria-hidden />
              RAG demo · grounded in the seeded knowledge base
            </p>
          </div>
          <button
            onClick={() => setShowKb((v) => !v)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
              showKb
                ? "border-marigold-400 bg-marigold-500 text-river-950"
                : "border-river-700 text-river-200 hover:bg-river-900"
            }`}
            title="Knowledge base"
            aria-label="Toggle knowledge base view"
          >
            <IconBook className="h-4 w-4" />
          </button>
          <button
            onClick={newSession}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-river-700 text-river-200 transition hover:bg-river-900"
            title="New conversation"
            aria-label="New conversation"
          >
            <IconRefresh className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-river-700 text-river-200 transition hover:bg-river-900"
            aria-label="Close"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {showKb ? (
          /* Knowledge base view */
          <div className="thin-scroll flex-1 overflow-y-auto p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink-faint">
              Knowledge base · {kb ? `${kb.total} chunks` : "loading…"}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
              Every answer is grounded in one of these documents. Illustrative data modelled on public UPPCB/CPCB
              formats.
            </p>
            <div className="mt-3 space-y-2">
              {(kb?.chunks ?? []).map((c) => (
                <div key={c.id} className="rounded-lg border border-ink/10 bg-cream px-3.5 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide ${
                        c.kind === "advisory"
                          ? "bg-river-600 text-cream"
                          : c.kind === "criteria"
                            ? "bg-marigold-500 text-river-950"
                            : "bg-ink/80 text-cream"
                      }`}
                    >
                      {c.kind}
                    </span>
                    {c.category ? (
                      <span className="rounded bg-sand px-1.5 py-0.5 text-[9.5px] font-extrabold text-ink-soft">
                        Cat {c.category}
                      </span>
                    ) : null}
                    {c.monthLabel ? (
                      <span className="rounded bg-sand px-1.5 py-0.5 text-[9.5px] font-extrabold text-ink-soft">
                        {c.monthLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-[13px] font-bold text-ink">{c.title}</p>
                  {c.station ? <p className="text-[11.5px] text-ink-faint">Station: {c.station}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="thin-scroll flex-1 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-river-600 text-cream">
                    <IconWaves className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="text-[15px] font-extrabold text-ink">Namaste! Main Gomti Saathi hoon.</p>
                    <p className="mx-auto mt-1 max-w-[300px] text-[13px] leading-relaxed text-ink-faint">
                      Ask about any monitored stretch of the Gomti — English, Hindi or Hinglish.
                    </p>
                  </div>
                  <div className="flex max-w-[340px] flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => void send(s)}
                        className="rounded-full border border-river-300 bg-river-50 px-3 py-1.5 text-[12px] font-bold text-river-800 transition hover:bg-river-100"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {messages.map((m) =>
                    m.role === "user" ? (
                      <div key={m.id} className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-river-700 px-4 py-2.5 text-[13.5px] leading-relaxed text-cream">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className="flex justify-start">
                        <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-ink/10 bg-cream px-4 py-3 shadow-sm">
                          {m.verdict && m.verdict !== "info" ? <VerdictPill kind={m.verdict} /> : null}
                          <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-ink">
                            {m.content}
                          </p>
                          {m.sources && m.sources.length > 0 ? (
                            <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-dashed border-ink/10 pt-2">
                              {m.sources.map((s) => (
                                <span
                                  key={s.title + (s.detail ?? "")}
                                  className="rounded-md border border-ink/12 bg-paper px-2 py-0.5 text-[10.5px] font-bold text-ink-soft"
                                >
                                  {s.title}
                                  {s.detail ? ` · ${s.detail}` : ""}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )
                  )}
                  {busy ? (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-ink/10 bg-cream px-4 py-3 shadow-sm">
                        <span className="typing-dot h-2 w-2 rounded-full bg-river-600" />
                        <span className="typing-dot h-2 w-2 rounded-full bg-river-600" style={{ animationDelay: "0.15s" }} />
                        <span className="typing-dot h-2 w-2 rounded-full bg-river-600" style={{ animationDelay: "0.3s" }} />
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Suggestions when there are already messages */}
            {messages.length > 0 ? (
              <div className="thin-scroll flex gap-2 overflow-x-auto border-t border-ink/8 bg-paper px-3 pt-2.5 pb-1">
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="shrink-0 rounded-full border border-ink/15 bg-cream px-3 py-1 text-[11px] font-bold text-ink-soft transition hover:border-river-400 hover:text-river-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Input */}
            <form onSubmit={onSubmit} className="border-t border-ink/10 bg-cream px-3 py-3">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the Gomti… e.g. “Gaughat ke paas nahana safe hai?”"
                  className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-paper px-3.5 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-ink-faint focus:border-river-500 focus:ring-2 focus:ring-river-200"
                  aria-label="Ask Gomti Saathi"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-river-600 text-cream transition enabled:hover:bg-river-700 disabled:opacity-40"
                  aria-label="Send message"
                >
                  <IconSend className="h-4.5 w-4.5" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10.5px] leading-snug text-ink-faint">
                Conceptual demo · answers grounded in an illustrative knowledge base — not an official UPPCB advisory.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
