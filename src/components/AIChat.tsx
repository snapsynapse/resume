import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { demoResponses } from "@/data/sam-profile";
import { useRoleContext, type PublicRoleContext } from "@/lib/role-context-client";
import { track } from "@/lib/analytics";
import { lengthBucket } from "@/lib/jd-review";

type Message = { role: "user" | "assistant"; content: string };

type AIChatProps = { isOpen: boolean; onClose: () => void };

type ChatMode = "live" | "sample" | null;

// Server caps a single /api/chat request at 20 messages (see api/chat.ts). Once a
// conversation grows past that, every subsequent turn would otherwise fail forever.
// Trim silently from the front, keeping the most recent messages, and never split a
// user/assistant pair so the trimmed history still starts on a user turn.
const MAX_REQUEST_MESSAGES = 20;

const trimHistoryForRequest = (history: Message[], maxMessages = MAX_REQUEST_MESSAGES): Message[] => {
  if (history.length <= maxMessages) return history;
  let start = history.length - maxMessages;
  if (history[start].role === "assistant") start += 1;
  return history.slice(start);
};

// A mid-stream failure sometimes still carries whatever text arrived before the
// connection dropped. Carrying that text on the thrown error lets the caller keep
// a partial live answer instead of discarding it for the canned sample fallback.
class PartialStreamError extends Error {
  partialText: string;

  constructor(partialText: string, message = "stream_interrupted") {
    super(message);
    this.partialText = partialText;
  }
}

const defaultSuggestedQuestions = [
  "Would Sam be a fit for a content operations or AI education systems role?",
  "What's PAICE and why is it structured as a PBC?",
  "How does Sam turn AI capability into human capability?",
  "Tell me about a time the obvious approach would have failed.",
];

// Fallback router used when /api/chat is unavailable (local `vite` dev without `vercel dev`, or upstream failure).
const fallbackResponse = (question: string, roleContext: PublicRoleContext | null): string => {
  if (roleContext?.demoResponseKey && roleContext.demoResponseKey in demoResponses) {
    return demoResponses[roleContext.demoResponseKey];
  }
  const q = question.toLowerCase();
  if (q.includes("ai education") || q.includes("curriculum") || q.includes("learning")) {
    return demoResponses.aiEducation;
  }
  if (q.includes("openai") || q.includes("content ops") || q.includes("content operations")) {
    return demoResponses.contentOps;
  }
  if (q.includes("paice") || q.includes("portfolio") || q.includes("pbc")) {
    return demoResponses.paice;
  }
  if (q.includes("failure") || q.includes("mistake") || q.includes("wrong") || q.includes("regret")) {
    return demoResponses.failure;
  }
  return demoResponses.default;
};

const AIChat = ({ isOpen, onClose }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  // Selection comes from the URL only; the public context comes from the server when an
  // employer key is present and from the bundled target presets otherwise.
  const { selection: roleSelection, roleContext } = useRoleContext();
  const [chatMode, setChatMode] = useState<ChatMode>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => () => requestController.current?.abort(), []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const streamFromApi = async (history: Message[], signal: AbortSignal): Promise<string> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, roleSelection }),
      signal,
    });
    if (signal.aborted) throw new DOMException("Request cancelled", "AbortError");

    // Rate-limit / error path: server returns JSON with structured error body, not a stream.
    // This shape (detail + limit/graceful_boundary) is the Graceful Boundaries response
    // format; it can arrive on 429 or on other 4xx statuses (e.g. a conversation-length
    // cap), so detect it by shape rather than pinning to one status code.
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const isGracefulBoundary =
        typeof data.detail === "string" &&
        (res.status === 429 || Boolean(data.graceful_boundary) || typeof data.limit === "string");
      if (isGracefulBoundary) {
        return `${data.detail}\n\n(Rate limit: ${data.limit ?? "public API limit"}. Retry in ~${data.retryAfterSeconds ?? 0}s, or email sam@sam-rogers.com directly.)`;
      }
      throw new Error(data.detail || data.error || `HTTP ${res.status}`);
    }

    // Stream path: read text chunks, append to UI as they arrive.
    if (!res.body) throw new Error("no_response_body");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    setIsWaiting(false);
    setIsStreaming(true);
    setStreamingText("");

    try {
      while (true) {
        let done: boolean | undefined;
        let value: Uint8Array | undefined;
        try {
          ({ done, value } = await reader.read());
        } catch (err) {
          throw new PartialStreamError(full, err instanceof Error ? err.message : "stream_read_failed");
        }
        if (done) {
          // Flush any buffered bytes from a multi-byte char split across chunks.
          full += decoder.decode();
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        if (signal.aborted) return full;
        setStreamingText(full);
      }
    } finally {
      reader.releaseLock();
    }

    return full;
  };

  const handleSubmit = async (question: string) => {
    if (!question.trim() || isStreaming || isWaiting) return;
    const source = messages.length === 0 ? "initial" : "follow_up";
    track("ai_chat_message_sent", {
      source,
      lengthBucket: lengthBucket(question.length),
    });
    const nextHistory: Message[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(nextHistory);
    setInput("");
    setIsWaiting(true);
    const controller = new AbortController();
    requestController.current = controller;

    try {
      const response = await streamFromApi(trimHistoryForRequest(nextHistory), controller.signal);
      if (controller.signal.aborted) return;
      setChatMode("live");
      track("ai_chat_response_received", {
        mode: "live",
        source,
        lengthBucket: lengthBucket(response.length),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.warn("API call failed, using fallback:", err);
      const partialText = err instanceof PartialStreamError ? err.partialText.trim() : "";
      if (partialText) {
        // A live answer arrived and was interrupted mid-stream. Keep it rather than
        // discarding it for the sample fallback, which would misrepresent it as a
        // complete answer or as a total outage.
        setChatMode("live");
        // Reuse the existing "received" event (rather than adding a new analytics
        // event type owned by src/lib/analytics.ts) and mark it interrupted via `mode`.
        track("ai_chat_response_received", {
          mode: "interrupted",
          source,
          lengthBucket: lengthBucket(partialText.length),
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `${partialText}\n\n[Response interrupted — connection dropped mid-answer.]`,
          },
        ]);
      } else {
        setChatMode("sample");
        track("ai_chat_response_failed", { source });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sample response because the live AI endpoint is unavailable:\n\n${fallbackResponse(question, roleContext)}`,
          },
        ]);
      }
    } finally {
      if (requestController.current === controller) requestController.current = null;
      // Always clear the loading indicators on every terminal path (success, rate
      // limit, or error) so the input never stays disabled after one failed turn.
      if (!controller.signal.aborted) {
        setIsWaiting(false);
        setIsStreaming(false);
        setStreamingText("");
      }
    }
  };

  const busy = isStreaming || isWaiting;
  const statusLine =
    chatMode === "sample"
      ? "Sample mode: live AI unavailable"
      : roleContext
        ? `Tuned for: ${roleContext.label}`
        : "Ready to answer your questions";

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="animate-fade-in fixed inset-0 z-50 bg-background/80 backdrop-blur-xs" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="animate-dialog-slide-up fixed left-1/2 top-1/2 z-50 flex h-[80vh] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl focus:outline-hidden"
        >
          <ChatHeader status={statusLine} />

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {chatMode === "sample" ? (
              <div className="rounded-xl border border-warning/20 bg-warning-muted px-4 py-3 text-sm text-warning">
                Live AI is unavailable. The answer below is a labeled sample response from local profile data.
              </div>
            ) : null}

            {messages.length === 0 && !busy ? (
              <EmptyState
                roleLabel={roleContext?.label ?? null}
                questions={roleContext ? roleContext.suggestedQuestions : defaultSuggestedQuestions}
                onPick={handleSubmit}
              />
            ) : null}

            {messages.map((message, i) => (
              <Bubble key={i} from={message.role}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </Bubble>
            ))}

            {isWaiting ? (
              <Bubble from="assistant">
                <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                  Thinking...
                </p>
              </Bubble>
            ) : null}

            {isStreaming ? (
              <Bubble from="assistant">
                <p aria-live="polite" className="whitespace-pre-wrap text-sm leading-relaxed">
                  {streamingText}
                  <span className="animate-typing-cursor ml-1 inline-block h-4 w-2 bg-accent" />
                </p>
              </Bubble>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <Composer value={input} onChange={setInput} onSend={() => handleSubmit(input)} busy={busy} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

const ChatHeader = ({ status }: { status: string }) => (
  <div className="flex items-center justify-between border-b border-border p-4">
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-accent to-primary font-serif font-bold text-accent-foreground"
      >
        S
      </span>
      <div>
        <DialogPrimitive.Title className="font-medium text-foreground">Ask AI About Sam</DialogPrimitive.Title>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          {status}
        </p>
      </div>
    </div>
    <DialogPrimitive.Close
      aria-label="Close chat"
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <X className="h-5 w-5" />
    </DialogPrimitive.Close>
  </div>
);

const EmptyState = ({
  roleLabel,
  questions,
  onPick,
}: {
  roleLabel: string | null;
  questions: readonly string[];
  onPick: (question: string) => void;
}) => (
  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
    <Sparkles aria-hidden="true" className="mb-4 h-12 w-12 text-accent" />
    <h3 className="mb-2 font-serif text-xl text-foreground">
      {roleLabel ? `Here about ${roleLabel}?` : "What would you like to know?"}
    </h3>
    <p className="mb-6 max-w-md text-sm text-muted-foreground">
      {roleLabel
        ? "Start with one of these — they're the questions most recruiters ask first. Or type your own."
        : "Ask specific questions about Sam's experience, skills, or fit for your role. Get honest, detailed answers."}
    </p>
    <ul className="w-full max-w-md space-y-2">
      {questions.map((question) => (
        <li key={question}>
          <button
            type="button"
            onClick={() => onPick(question)}
            className="w-full rounded-xl border border-transparent bg-secondary p-3 text-left text-sm text-foreground transition-colors hover:border-accent/30 hover:bg-muted"
          >
            “{question}”
          </button>
        </li>
      ))}
    </ul>
  </div>
);

// One chat turn. Visitor turns sit right in the accent color; assistant turns sit left.
const Bubble = ({ from, children }: { from: Message["role"]; children: ReactNode }) => {
  const mine = from === "user";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          mine ? "rounded-br-md bg-accent text-accent-foreground" : "rounded-bl-md bg-secondary text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
};

const Composer = ({
  value,
  onChange,
  onSend,
  busy,
}: {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  busy: boolean;
}) => (
  <form
    className="flex gap-3 border-t border-border p-4"
    onSubmit={(event) => {
      event.preventDefault();
      onSend();
    }}
  >
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={busy}
      aria-label="Ask a follow-up question"
      placeholder="Ask another question"
      className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-accent focus:outline-hidden disabled:opacity-50"
    />
    <button
      type="submit"
      disabled={busy || !value.trim()}
      aria-label="Send question"
      className="rounded-xl bg-accent px-4 py-3 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      <Send className="h-5 w-5" />
    </button>
  </form>
);

export default AIChat;
