import { useEffect, useRef, useState } from "react";
import { queryDocument, type RetrievedChunk } from "../api/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  context?: RetrievedChunk[];
  timestamp: number;
}

export function useChat(isEnabled: boolean) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  async function sendDirectPrompt(promptText: string) {
    if (!isEnabled || isLoading) return;
    const trimmed = promptText.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsLoading(true);

    try {
      const result = await queryDocument(trimmed, true);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
        context: result.context,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : "Something went wrong while querying documents.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendQuestion() {
    await sendDirectPrompt(question);
  }

  function clearChat() {
    setMessages([]);
    setQuestion("");
  }

  return {
    question,
    setQuestion,
    messages,
    isLoading,
    sendQuestion,
    sendDirectPrompt,
    clearChat,
    endRef,
  };
}
