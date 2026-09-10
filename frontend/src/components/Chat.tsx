import { useState, useRef, useEffect, type FormEvent, type ReactNode } from "react";
import {
  Send,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useChat, type ChatMessage } from "../hooks/useChat";
import { MarkdownMessage } from "./MarkdownMessage";
import { useTheme } from "../hooks/useTheme";
import type { RetrievedChunk } from "../api/client";

interface ChatProps {
  isEnabled: boolean;
  selectedDocument?: string | null;
  onClearDocumentFilter?: () => void;
  children: ReactNode;
}

const QUICK_PROMPTS = [
  { label: "Summarize Document", query: "Please provide a clear executive summary of the main points in the document." },
  { label: "Key Conclusions", query: "What are the most important conclusions, findings, or takeaways?" },
  { label: "Risks & Exceptions", query: "What limitations, risks, conditions, or exclusions are explicitly mentioned?" },
  { label: "Extract Key Data", query: "Extract any key dates, statistics, metrics, or table data mentioned in the text." },
];

export function Chat({
  isEnabled,
  selectedDocument,
  onClearDocumentFilter,
  children,
}: ChatProps) {
  const {
    question,
    setQuestion,
    messages,
    isLoading,
    sendQuestion,
    sendDirectPrompt,
    clearChat,
    endRef,
  } = useChat(isEnabled);

  const { theme } = useTheme();
  const isLight = theme === "light";

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [question]);

  function handleSubmit(event?: FormEvent) {
    if (event) event.preventDefault();
    if (!question.trim() || isLoading || !isEnabled) return;
    sendQuestion();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function handleCopy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  }

  function toggleSources(messageId: string) {
    setExpandedSources((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  }

  const hasMessages = messages.length > 0 || isLoading;

  // Theme-aware class sets
  const bg = isLight ? "bg-white" : "bg-[#0b0f17]";
  const borderColor = isLight ? "border-slate-200" : "border-slate-800";
  const inputBg = isLight ? "bg-slate-100 border-slate-300" : "bg-slate-900/60 border-slate-700";
  const inputText = isLight ? "text-slate-900 placeholder-slate-400" : "text-slate-100 placeholder-slate-500";
  const assistantBubble = isLight
    ? "border border-slate-200 bg-slate-50 text-slate-900 shadow-lg shadow-black/5"
    : "border border-slate-700/60 bg-slate-800/60 text-slate-100 shadow-lg shadow-black/30";
  const sourcesAccordion = isLight
    ? "border-slate-200 bg-slate-100"
    : "border-slate-700 bg-slate-900/60";
  const sourceCard = isLight
    ? "border-slate-300 bg-white hover:border-slate-400"
    : "border-slate-700 bg-slate-800 hover:border-slate-600";
  const actionBarBorder = isLight ? "border-slate-200" : "border-slate-700";
  const actionBtn = isLight
    ? "text-slate-600 hover:bg-slate-200 hover:text-slate-800"
    : "text-slate-400 hover:bg-slate-700 hover:text-slate-200";
  const sourcesBtn = isLight
    ? "bg-slate-200 text-emerald-700 hover:bg-slate-300 hover:text-emerald-800"
    : "bg-slate-700 text-emerald-400 hover:bg-slate-600 hover:text-emerald-300";
  const senderText = isLight ? "text-slate-600" : "text-slate-400";
  const aiLabel = isLight ? "text-slate-700" : "text-slate-300";
  const pillBg = isLight
    ? "border-slate-300 bg-slate-100 text-slate-700 hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-800"
    : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-300";
  const clearChatBtn = isLight
    ? "text-slate-600 hover:bg-slate-200 hover:text-slate-800"
    : "text-slate-400 hover:bg-slate-700 hover:text-slate-200";
  const footerText = isLight ? "text-slate-500" : "text-slate-500";
  const thinkingBubble = isLight
    ? "border border-slate-200 bg-slate-50 text-slate-700 shadow-lg shadow-black/5"
    : "border border-slate-700/60 bg-slate-800/60 text-slate-300 shadow-lg shadow-black/30";

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${bg} transition-colors duration-200`}>
      {/* Active Document Filter Notification */}
      {selectedDocument && (
        <div className={`flex items-center justify-between border-b px-6 py-2 text-xs transition-colors ${
          isLight
            ? "border-emerald-600/20 bg-emerald-100 text-emerald-800"
            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
        }`}>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>
              Searching exclusively in: <strong className="font-semibold">{selectedDocument}</strong>
            </span>
          </div>
          <button
            onClick={onClearDocumentFilter}
            className={`rounded px-2 py-0.5 text-[11px] font-medium transition ${
              isLight ? "text-emerald-800 hover:bg-emerald-600/20" : "text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Main Conversation Area */}
      {hasMessages ? (
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.map((message: ChatMessage) => (
              <div
                key={message.id}
                className={`flex flex-col gap-1.5 ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Sender Pill */}
                <div className={`flex items-center gap-2 px-1 text-[11px] ${senderText}`}>
                  {message.role === "assistant" ? (
                    <div className="flex items-center gap-1.5">
                      <div className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        isLight ? "bg-emerald-600/20 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        <ShieldCheck className="h-3 w-3" />
                      </div>
                      <span className={`font-semibold ${aiLabel}`}>AI</span>
                      <span className={`text-[10px] ${senderText}`}>Answer</span>
                    </div>
                  ) : (
                    <span className={`font-medium ${senderText}`}>You</span>
                  )}
                  <span className={`text-[10px] ${senderText}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative rounded-2xl text-sm leading-relaxed ${
                    message.role === "user"
                      ? "max-w-[85%] bg-gradient-to-r from-emerald-700 to-teal-700 px-4 py-3 text-white shadow-md shadow-emerald-900/20"
                      : `max-w-[95%] px-5 py-4 ${assistantBubble}`
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div>
                      <MarkdownMessage content={message.content} />

                      {/* Action Bar for Assistant Message */}
                      <div className={`mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-xs ${actionBarBorder}`}>
                        <div className="flex items-center gap-2">
                          {message.context && message.context.length > 0 && (
                            <button
                              onClick={() => toggleSources(message.id)}
                              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${sourcesBtn}`}
                            >
                              <FileText className="h-3 w-3" />
                              <span>
                                {message.context.length}{" "}
                                {message.context.length === 1 ? "source quote" : "source quotes"}
                              </span>
                              {expandedSources[message.id] ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(message.id, message.content)}
                            title="Copy answer"
                            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition ${actionBtn}`}
                          >
                            {copiedId === message.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-500">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Grounded Sources Accordion */}
                      {message.context &&
                        message.context.length > 0 &&
                        expandedSources[message.id] && (
                          <div className={`mt-3 flex flex-col gap-2 rounded-xl border p-3 text-xs ${sourcesAccordion}`}>
                            <div className={`flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider ${senderText}`}>
                              <span>Document Sources & Quotes</span>
                              <span className={`text-[10px] ${senderText}`}>Sorted by Best Match</span>
                            </div>

                            <div className="flex flex-col gap-2">
                              {message.context.map((chunk: RetrievedChunk, index: number) => {
                                const sourceName = chunk.metadata?.source || "Document";
                                const chunkIndex = chunk.metadata?.chunk_index ?? index;
                                const matchPercent = Math.max(
                                  0,
                                  Math.min(100, Math.round((1.0 - (chunk.distance || 0)) * 100))
                                );

                                return (
                                  <div
                                    key={index}
                                    className={`rounded-lg border p-2.5 transition ${sourceCard}`}
                                  >
                                    <div className="mb-1.5 flex items-center justify-between text-[10px]">
                                      <span className="font-semibold text-emerald-600 truncate max-w-[200px]">
                                        Quote {index + 1} — {sourceName} (Section #{chunkIndex + 1})
                                      </span>
                                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono border ${
                                        isLight
                                          ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                      }`}>
                                        {matchPercent}% match
                                      </span>
                                    </div>
                                    <p className={`font-mono text-[11px] leading-relaxed whitespace-pre-wrap ${
                                      isLight ? "text-slate-700" : "text-slate-300"
                                    }`}>
                                      {chunk.content}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking / Streaming Loading State */}
            {isLoading && (
              <div className="mr-auto flex max-w-[85%] flex-col gap-1.5">
                <div className={`flex items-center gap-2 px-1 text-[11px] ${senderText}`}>
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    isLight ? "bg-emerald-600/20 text-emerald-700" : "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    <ShieldCheck className="h-3 w-3" />
                  </div>
                  <span className={`font-semibold ${aiLabel}`}>AI</span>
                </div>
                <div className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm ${thinkingBubble}`}>
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-600" />
                  </span>
                  <span className={`text-xs animate-pulse ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    Searching documents and writing answer...
                  </span>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center overflow-y-auto p-4 md:p-8">
          {children && typeof children === "object" && "type" in children
            ? (children as any).type({
                ...(children as any).props,
                onSelectPrompt: sendDirectPrompt,
              })
            : children}
        </div>
      )}

      {/* Input Bar & Interactive Quick Prompt Pills */}
      <div className={`shrink-0 border-t p-4 md:px-8 transition-colors duration-200 ${borderColor} ${bg}`}>
        <div className="mx-auto max-w-3xl flex flex-col gap-2.5">
          {/* Quick-Prompt Pills */}
          {isEnabled && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className={`flex items-center gap-1 text-[11px] font-medium shrink-0 mr-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                <Sparkles className="h-3 w-3 text-emerald-500" /> Suggested:
              </span>
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  type="button"
                  onClick={() => sendDirectPrompt(qp.query)}
                  disabled={isLoading}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] transition disabled:opacity-50 ${pillBg}`}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          )}

          {/* Interactive Chat Form */}
          <form
            onSubmit={handleSubmit}
            className={`relative flex items-end gap-2 rounded-2xl border p-2 transition-all focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30 ${inputBg}`}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isEnabled
                  ? "Ask anything about your uploaded documents... (Shift+Enter for newline)"
                  : "Upload a document in the sidebar to start asking questions..."
              }
              disabled={!isEnabled || isLoading}
              className={`min-h-[44px] max-h-[160px] w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none disabled:opacity-50 ${inputText}`}
            />

            <div className="flex items-center gap-1.5 pb-1 pr-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear conversation"
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${clearChatBtn}`}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={!isEnabled || isLoading || !question.trim()}
                title="Send query (Enter)"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Micro Footer Hint */}
          <div className={`flex items-center justify-between px-1 text-[10px] ${footerText}`}>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Grounded Retrieval-Augmented Generation with Source Evidence
            </span>
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
