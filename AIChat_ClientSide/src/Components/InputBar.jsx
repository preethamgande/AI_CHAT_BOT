import { useState } from "react";

export default function InputBar({
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
}) {
  const [message, setMessage] = useState("");

  const submit = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || disabled || isStreaming) return;

    onSend?.(trimmedMessage);
    setMessage("");
  };

  const handleButtonClick = () => {
    if (isStreaming) {
      onStop?.();
      return;
    }

    submit();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-2 shadow-inner">
        {/* Textarea */}
        <textarea
          rows="1"
          value={message}
          disabled={disabled}
          placeholder={
            isStreaming ? "AI is responding..." : "Type your message..."
          }
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              if (!isStreaming) {
                submit();
              }
            }
          }}
          className="flex-1 resize-y max-h-32 bg-transparent px-5 py-3 text-[15.5px] text-black placeholder:text-slate-400 outline-none leading-relaxed"
        />

        {/* Send / Stop Button */}
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled || (!isStreaming && !message.trim())}
          className={`cursor-pointer rounded-2xl px-8 py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all ${
            isStreaming
              ? "bg-gradient-to-r from-red-600 to-rose-600"
              : "bg-gradient-to-r from-indigo-600 to-violet-600"
          }`}
        >
          {isStreaming ? "Stop" : "Send"}
        </button>
      </div>
    </div>
  );
}


// Previous version without stop button.

// import { useState } from "react";

// export default function InputBar({ onSend, disabled }) {
//   const [message, setMessage] = useState("");

//   const submit = () => {
//     if (!message.trim() || disabled) return;
//     onSend(message.trim());
//     setMessage("");
//   };

//   return (
//     <div className="mx-auto max-w-3xl">
//       <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-2 shadow-inner">
//         {/* Textarea */}
//         <textarea
//           rows="1"
//           value={message}
//           disabled={disabled}
//           placeholder="Type your message..."
//           onChange={(e) => setMessage(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === "Enter" && !e.shiftKey) {
//               e.preventDefault();
//               submit();
//             }
//           }}
//           className="flex-1 resize-y max-h-32 bg-transparent px-5 py-3 text-[15.5px] text-black placeholder:text-slate-400 outline-none leading-relaxed"
//         />

//         {/* Send Button */}
//         <button
//           onClick={submit}
//           disabled={disabled || !message.trim()}
//           className=" cursor-pointer rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all"
//         >
//           Send
//         </button>
//       </div>
//     </div>
//   );
// }
