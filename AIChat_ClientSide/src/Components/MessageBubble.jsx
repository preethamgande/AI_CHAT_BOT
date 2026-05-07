import React from "react";

export default function MessageBubble({ role = "ai", text = "" }) {
  const normalizedRole = String(role || "").toLowerCase();
  const isUser = normalizedRole === "user";

  const safeText = typeof text === "string" ? text : String(text ?? "");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} group`}>
      <div
        className={`max-w-[75%] px-6 py-3.5 text-[15.5px] leading-relaxed shadow-md transition-all ${
          isUser
            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-3xl rounded-br-none"
            : "glass bg-white/95 text-slate-800 rounded-3xl rounded-bl-none border border-white/20"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{safeText || " "}</div>
      </div>
    </div>
  );
}

// import React from "react";

// export default function MessageBubble({ role, text }) {
//   const isUser = role === "user";

//   return (
//     <div className={`flex ${isUser ? "justify-end" : "justify-start"} group`}>
//       <div
//         className={`max-w-[75%] px-6 py-3.5 text-[15.5px] leading-relaxed shadow-md transition-all ${
//           isUser
//             ? // User Message - Similar to the purple bubble in image
//               "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-3xl rounded-br-none"
//             : // AI Message - Clean white/glass bubble like in the image
//               "glass bg-white/95 text-slate-800 rounded-3xl rounded-bl-none border border-white/20"
//         }`}
//       >
//         <div className="whitespace-pre-wrap break-words">{text}</div>
//       </div>
//     </div>
//   );
// }
