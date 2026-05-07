import { useEffect, useRef, useState, useCallback } from "react";
import { streamChatMessage } from "../Services/chatService";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";

function createClientId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ChatBox({
  activeChatId,
  messages = [],
  setMessagesForChat,
  refreshChats,
}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingChatId, setStreamingChatId] = useState(null);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const eventSourceRef = useRef(null);
  const activeChatIdRef = useRef(activeChatId);
  const streamingAiMessageIdRef = useRef(null);
  const streamingChatIdRef = useRef(null);

  const isCurrentChatStreaming =
    isStreaming && streamingChatId === activeChatId;

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isCurrentChatStreaming]);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    setIsStreaming(false);
    setStreamingChatId(null);
    setError(null);
  }, [activeChatId]);

  const handleStop = useCallback(() => {
    const chatIdToStop = streamingChatIdRef.current;
    const aiMessageIdToStop = streamingAiMessageIdRef.current;

    eventSourceRef.current?.close();
    eventSourceRef.current = null;

    setIsStreaming(false);
    setStreamingChatId(null);
    setError(null);

    streamingChatIdRef.current = null;
    streamingAiMessageIdRef.current = null;

    if (!chatIdToStop || !aiMessageIdToStop) return;

    setMessagesForChat?.(chatIdToStop, (prev = []) => {
      return prev.map((msg) => {
        if (msg?._clientId !== aiMessageIdToStop) return msg;

        const existingContent = msg.content || "";

        return {
          ...msg,
          role: "ai",
          content: existingContent || "Response stopped.",
        };
      });
    });

    refreshChats?.();
  }, [setMessagesForChat, refreshChats]);

  const handleSend = useCallback(
    (message) => {
      const trimmedMessage = message?.trim();

      if (
        !trimmedMessage ||
        !activeChatId ||
        typeof setMessagesForChat !== "function"
      ) {
        return;
      }

      const chatIdAtSendTime = activeChatId;
      const userMessageId = createClientId();
      const aiMessageId = createClientId();

      setError(null);

      eventSourceRef.current?.close();
      eventSourceRef.current = null;

      streamingChatIdRef.current = chatIdAtSendTime;
      streamingAiMessageIdRef.current = aiMessageId;

      setMessagesForChat(chatIdAtSendTime, (prev = []) => [
        ...prev,
        {
          _clientId: userMessageId,
          role: "user",
          content: trimmedMessage,
        },
        {
          _clientId: aiMessageId,
          role: "ai",
          content: "",
        },
      ]);

      setIsStreaming(true);
      setStreamingChatId(chatIdAtSendTime);

      eventSourceRef.current = streamChatMessage(
        chatIdAtSendTime,
        trimmedMessage,

        // Stream chunk
        (chunk) => {
          setMessagesForChat(chatIdAtSendTime, (prev = []) => {
            const updated = [...prev];

            const aiMessageIndex = updated.findIndex(
              (msg) => msg?._clientId === aiMessageId
            );

            if (aiMessageIndex === -1) {
              return [
                ...updated,
                {
                  _clientId: aiMessageId,
                  role: "ai",
                  content: chunk || "",
                },
              ];
            }

            const currentAiMessage = updated[aiMessageIndex];

            updated[aiMessageIndex] = {
              ...currentAiMessage,
              role: "ai",
              content: `${currentAiMessage.content || ""}${chunk || ""}`,
            };

            return updated;
          });
        },

        // Stream complete
        () => {
          if (activeChatIdRef.current === chatIdAtSendTime) {
            setIsStreaming(false);
            setStreamingChatId(null);
          }

          eventSourceRef.current = null;
          streamingChatIdRef.current = null;
          streamingAiMessageIdRef.current = null;

          refreshChats?.();
        },

        // Stream error
        (errorMessage) => {
          const safeErrorMessage =
            errorMessage || "Something went wrong while getting the AI response.";

          if (activeChatIdRef.current === chatIdAtSendTime) {
            setIsStreaming(false);
            setStreamingChatId(null);
            setError(safeErrorMessage);
          }

          eventSourceRef.current = null;
          streamingChatIdRef.current = null;
          streamingAiMessageIdRef.current = null;

          setMessagesForChat(chatIdAtSendTime, (prev = []) => {
            const updated = [...prev];

            const aiMessageIndex = updated.findIndex(
              (msg) => msg?._clientId === aiMessageId
            );

            if (aiMessageIndex === -1) {
              return [
                ...updated,
                {
                  _clientId: aiMessageId,
                  role: "ai",
                  content: safeErrorMessage,
                },
              ];
            }

            updated[aiMessageIndex] = {
              ...updated[aiMessageIndex],
              role: "ai",
              content: safeErrorMessage,
            };

            return updated;
          });
        }
      );
    },
    [activeChatId, setMessagesForChat, refreshChats]
  );

  const handleRetry = () => {
    const lastUserMsg = [...(messages || [])]
      .reverse()
      .find((m) => m?.role === "user" && m?.content);

    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  };

  return (
    <div className="my-2 mr-4 flex flex-1 flex-col overflow-hidden rounded-3xl glass border border-white/10">
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl h-full flex flex-col">
          {(messages || []).length === 0 && !isCurrentChatStreaming && !error && (
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
            {(messages || []).filter(Boolean).map((message, index) => (
              <MessageBubble
                key={message._clientId || message.id || message._id || index}
                role={message.role || "ai"}
                text={message.content || ""}
              />
            ))}

            {isCurrentChatStreaming && (
              <div className="flex items-center gap-3 px-5 py-4 glass w-fit rounded-2xl">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                <span className="text-sm text-slate-400">
                  Thinking about your request...
                </span>
              </div>
            )}

            {error && (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
                <p className="mb-4">{error}</p>

                <button
                  type="button"
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

      <div className="p-6 pt-2 border-t border-white/10">
        <InputBar
          onSend={handleSend}
          onStop={handleStop}
          disabled={!activeChatId}
          isStreaming={isCurrentChatStreaming}
        />
      </div>
    </div>
  );
}


// Previous version without stop button.

// import { useEffect, useRef, useState, useCallback } from "react";
// import { streamChatMessage } from "../Services/chatService";
// import MessageBubble from "./MessageBubble";
// import InputBar from "./InputBar";

// function createClientId() {
//   if (typeof crypto !== "undefined" && crypto.randomUUID) {
//     return crypto.randomUUID();
//   }

//   return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
// }

// export default function ChatBox({
//   activeChatId,
//   messages = [],
//   setMessagesForChat,
//   refreshChats,
// }) {
//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamingChatId, setStreamingChatId] = useState(null);
//   const [error, setError] = useState(null);

//   const bottomRef = useRef(null);
//   const eventSourceRef = useRef(null);
//   const activeChatIdRef = useRef(activeChatId);

//   const isCurrentChatStreaming =
//     isStreaming && streamingChatId === activeChatId;

//   useEffect(() => {
//     activeChatIdRef.current = activeChatId;
//   }, [activeChatId]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, isCurrentChatStreaming]);

//   useEffect(() => {
//     return () => {
//       eventSourceRef.current?.close();
//       eventSourceRef.current = null;
//     };
//   }, []);

//   useEffect(() => {
//     setIsStreaming(false);
//     setStreamingChatId(null);
//     setError(null);
//   }, [activeChatId]);

//   const handleSend = useCallback(
//     (message) => {
//       const trimmedMessage = message?.trim();

//       if (
//         !trimmedMessage ||
//         !activeChatId ||
//         typeof setMessagesForChat !== "function"
//       ) {
//         return;
//       }

//       const chatIdAtSendTime = activeChatId;
//       const userMessageId = createClientId();
//       const aiMessageId = createClientId();

//       setError(null);

//       eventSourceRef.current?.close();
//       eventSourceRef.current = null;

//       setMessagesForChat(chatIdAtSendTime, (prev = []) => [
//         ...prev,
//         {
//           _clientId: userMessageId,
//           role: "user",
//           content: trimmedMessage,
//         },
//         {
//           _clientId: aiMessageId,
//           role: "ai",
//           content: "",
//         },
//       ]);

//       setIsStreaming(true);
//       setStreamingChatId(chatIdAtSendTime);

//       eventSourceRef.current = streamChatMessage(
//         chatIdAtSendTime,
//         trimmedMessage,

//         // Stream chunk
//         (chunk) => {
//           setMessagesForChat(chatIdAtSendTime, (prev = []) => {
//             const updated = [...prev];

//             const aiMessageIndex = updated.findIndex(
//               (msg) => msg?._clientId === aiMessageId
//             );

//             if (aiMessageIndex === -1) {
//               return [
//                 ...updated,
//                 {
//                   _clientId: aiMessageId,
//                   role: "ai",
//                   content: chunk || "",
//                 },
//               ];
//             }

//             const currentAiMessage = updated[aiMessageIndex];

//             updated[aiMessageIndex] = {
//               ...currentAiMessage,
//               role: "ai",
//               content: `${currentAiMessage.content || ""}${chunk || ""}`,
//             };

//             return updated;
//           });
//         },

//         // Stream complete
//         () => {
//           if (activeChatIdRef.current === chatIdAtSendTime) {
//             setIsStreaming(false);
//             setStreamingChatId(null);
//           }

//           eventSourceRef.current = null;
//           refreshChats?.();
//         },

//         // Stream error
//         (errorMessage) => {
//           const safeErrorMessage =
//             errorMessage || "Something went wrong while getting the AI response.";

//           if (activeChatIdRef.current === chatIdAtSendTime) {
//             setIsStreaming(false);
//             setStreamingChatId(null);
//             setError(safeErrorMessage);
//           }

//           setMessagesForChat(chatIdAtSendTime, (prev = []) => {
//             const updated = [...prev];

//             const aiMessageIndex = updated.findIndex(
//               (msg) => msg?._clientId === aiMessageId
//             );

//             if (aiMessageIndex === -1) {
//               return [
//                 ...updated,
//                 {
//                   _clientId: aiMessageId,
//                   role: "ai",
//                   content: safeErrorMessage,
//                 },
//               ];
//             }

//             updated[aiMessageIndex] = {
//               ...updated[aiMessageIndex],
//               role: "ai",
//               content: safeErrorMessage,
//             };

//             return updated;
//           });
//         }
//       );
//     },
//     [activeChatId, setMessagesForChat, refreshChats]
//   );

//   const handleRetry = () => {
//     const lastUserMsg = [...(messages || [])]
//       .reverse()
//       .find((m) => m?.role === "user" && m?.content);

//     if (lastUserMsg) {
//       handleSend(lastUserMsg.content);
//     }
//   };

//   return (
//     <div className="my-2 mr-4 flex flex-1 flex-col overflow-hidden rounded-3xl glass border border-white/10">
//       <main className="flex-1 overflow-y-auto p-8">
//         <div className="mx-auto max-w-3xl h-full flex flex-col">
//           {(messages || []).length === 0 && !isCurrentChatStreaming && !error && (
//             <div className="flex flex-1 items-center justify-center text-center">
//               <div>
//                 <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/10">
//                   <span className="text-6xl opacity-75">✦</span>
//                 </div>

//                 <h2 className="text-4xl font-semibold tracking-tight text-black-500">
//                   How can I help you today?
//                 </h2>

//                 <p className="mt-4 text-slate-400">
//                   Start typing to begin a conversation
//                 </p>
//               </div>
//             </div>
//           )}

//           <div className="flex flex-col gap-7 mt-auto">
//             {(messages || []).filter(Boolean).map((message, index) => (
//               <MessageBubble
//                 key={message._clientId || message.id || message._id || index}
//                 role={message.role || "ai"}
//                 text={message.content || ""}
//               />
//             ))}

//             {isCurrentChatStreaming && (
//               <div className="flex items-center gap-3 px-5 py-4 glass w-fit rounded-2xl">
//                 <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
//                 <span className="text-sm text-slate-400">
//                   Thinking about your request...
//                 </span>
//               </div>
//             )}

//             {error && (
//               <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
//                 <p className="mb-4">{error}</p>

//                 <button
//                   type="button"
//                   onClick={handleRetry}
//                   className="rounded-2xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
//                 >
//                   Retry
//                 </button>
//               </div>
//             )}
//           </div>

//           <div ref={bottomRef} className="h-8" />
//         </div>
//       </main>

//       <div className="p-6 pt-2 border-t border-white/10">
//         <InputBar
//           onSend={handleSend}
//           disabled={isCurrentChatStreaming || !activeChatId}
//         />
//       </div>
//     </div>
//   );
// }

