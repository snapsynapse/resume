import { useState, useEffect, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { demoResponses } from "@/data/sam-profile";
import {
  composeRoleContext,
  detectRoleSelection,
  type ActiveRoleContext,
  type RoleSelection,
} from "@/lib/role-context";
import { track } from "@/lib/analytics";
import { lengthBucket } from "@/lib/jd-review";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

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
const fallbackResponse = (question: string, roleContext: ActiveRoleContext | null): string => {
  if (roleContext?.demoResponseKey && roleContext.demoResponseKey in demoResponses) {
    return demoResponses[roleContext.demoResponseKey];
  }
  const q = question.toLowerCase();
  if (q.includes("anthropic") || q.includes("frontier") || q.includes("claude")) {
    return demoResponses.anthropic;
  }
  if (q.includes("openai") || q.includes("content ops") || q.includes("content operations")) {
    return demoResponses.openaiContentOps;
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
  const [roleSelection, setRoleSelection] = useState<RoleSelection>({});
  const [roleContext, setRoleContext] = useState<ActiveRoleContext | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selection = detectRoleSelection();
    setRoleSelection(selection);
    setRoleContext(composeRoleContext(selection));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const streamFromApi = async (history: Message[]): Promise<string> => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, roleSelection }),
    });

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
      setStreamingText(full);
    }

    return full;
  };

  const handleSubmit = async (question: string) => {
    if (!question.trim() || isStreaming || isWaiting) return;
    const source = messages.length === 0 ? "initial" : "follow_up";
    track("ai_chat_message_sent", {
      source,
      roleContext: roleContext?.label ?? "none",
      lengthBucket: lengthBucket(question.length),
    });
    const nextHistory: Message[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(nextHistory);
    setInput("");
    setIsWaiting(true);

    try {
      const response = await streamFromApi(trimHistoryForRequest(nextHistory));
      setChatMode("live");
      track("ai_chat_response_received", {
        mode: "live",
        source,
        lengthBucket: lengthBucket(response.length),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (err) {
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
      // Always clear the loading indicators on every terminal path (success, rate
      // limit, or error) so the input never stays disabled after one failed turn.
      setIsWaiting(false);
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl h-[80vh] bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-dialog-slide-up focus:outline-none"
          aria-describedby={undefined}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-accent-foreground font-serif font-bold">
              S
            </div>
            <div>
              <DialogPrimitive.Title className="text-foreground font-medium">
                Ask AI About Sam
              </DialogPrimitive.Title>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {chatMode === "sample"
                  ? "Sample mode: live AI unavailable"
                  : roleContext
                    ? `Tuned for: ${roleContext.label}`
                    : "Ready to answer your questions"}
              </p>
            </div>
          </div>
          <DialogPrimitive.Close
            aria-label="Close chat"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
          >
            <X className="w-5 h-5" />
          </DialogPrimitive.Close>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMode === "sample" && (
            <div className="rounded-xl border border-warning/20 bg-warning-muted px-4 py-3 text-sm text-warning">
              Live AI is unavailable. The answer below is a labeled sample response from local profile data.
            </div>
          )}

          {messages.length === 0 && !isStreaming && !isWaiting && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <Sparkles className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-xl font-serif text-foreground mb-2">
                {roleContext
                  ? `Here about ${roleContext.label}?`
                  : "What would you like to know?"}
              </h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md">
                {roleContext
                  ? "Start with one of these — they're the questions most recruiters ask first. Or type your own."
                  : "Ask specific questions about Sam's experience, skills, or fit for your role. Get honest, detailed answers."}
              </p>
              <div className="w-full max-w-md space-y-2">
                {(roleContext ? roleContext.suggestedQuestions : defaultSuggestedQuestions).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(q)}
                    className="w-full text-left p-3 bg-secondary rounded-xl text-sm text-foreground hover:bg-muted transition-colors border border-transparent hover:border-accent/30"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground rounded-br-md"
                    : "bg-secondary text-foreground rounded-bl-md"
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {isWaiting && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-secondary text-foreground rounded-2xl rounded-bl-md px-4 py-3">
                <p className="text-sm text-muted-foreground flex items-center gap-2" role="status">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Thinking...
                </p>
              </div>
            </div>
          )}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-secondary text-foreground rounded-2xl rounded-bl-md px-4 py-3">
                <p className="text-sm whitespace-pre-wrap leading-relaxed" aria-live="polite">
                  {streamingText}
                  <span className="inline-block w-2 h-4 bg-accent ml-1 animate-typing-cursor" />
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              disabled={isStreaming || isWaiting}
              aria-label="Ask a follow-up question"
              className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-accent focus:outline-none transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming || isWaiting}
              aria-label="Send question"
              className="px-4 py-3 bg-accent text-accent-foreground rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default AIChat;
