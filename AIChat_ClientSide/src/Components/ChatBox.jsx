import { useEffect, useRef, useState, useCallback } from "react";
import { streamChatMessage } from "../Services/chatService";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";

export default function ChatBox({
  activeChatId,
  messages,
  setMessages,
  refreshChats,
}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  const handleSend = useCallback(
    (message) => {
      if (!message.trim() || !activeChatId) return;
      setError(null);

      setMessages((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "ai", content: "" },
      ]);

      setIsStreaming(true);

      eventSourceRef.current = streamChatMessage(
        activeChatId,
        message,
        (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + chunk,
            };
            return updated;
          });
        },
        () => {
          setIsStreaming(false);
          refreshChats?.();
        },
        (errorMessage) => {
          setIsStreaming(false);
          setError(errorMessage);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "ai",
              content: errorMessage,
            };
            return updated;
          });
        },
      );
    },
    [activeChatId, setMessages, refreshChats],
  );

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) handleSend(lastUserMsg.content);
  };

  return (
    <div className="my-2 mr-4 flex flex-1 flex-col overflow-hidden rounded-3xl glass border border-white/10 ">
      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-8 ">
        <div className="mx-auto max-w-3xl h-full flex flex-col">
          {messages.length === 0 && !isStreaming && !error && (
            <div className="flex flex-1 items-center justify-center text-center">
              <div>
                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
                  <span className="text-6xl opacity-75">✦</span>
                </div>
                <h2 className="text-4xl font-semibold tracking-tight text-black-500">
                  How can I help you today?
                </h2>
                <p className="mt-4 text-slate-400">
                  Start typing to begin a conversation
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-7 mt-auto">
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                role={message.role}
                text={message.content}
              />
            ))}

            {isStreaming && (
              <div className="flex items-center gap-3 px-5 py-4 glass w-fit rounded-2xl">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                <span className="text-sm text-slate-400">
                  Thinking about your Request...
                </span>
              </div>
            )}

            {error && (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
                <p className="mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="rounded-2xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          <div ref={bottomRef} className="h-8" />
        </div>
      </main>

      {/* Input Area - Clean Version */}
      <div className="p-6 pt-2 border-t border-white/10">
        <InputBar onSend={handleSend} disabled={isStreaming || !activeChatId} />
      </div>
    </div>
  );
}
