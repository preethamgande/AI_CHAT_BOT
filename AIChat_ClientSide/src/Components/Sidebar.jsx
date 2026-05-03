import { Trash2, Plus } from "lucide-react";

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}) {
  return (
    <aside className="m-4 w-80 shrink-0 flex flex-col overflow-hidden rounded-3xl glass border border-white/10 shadow-2xl h-[calc(100vh-2rem)]">
      {/* New Chat Button */}
      <div className="p-6">
        <button
          onClick={onNewChat}
          className="cursor-pointer  w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:brightness-110 active:scale-[0.97] transition-all"
        >
          NEW CHAT
        </button>
      </div>

      {/* Chat History Section */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <p className="mb-4 px-4 text-xs font-bold uppercase tracking-widest text-black-300">
          CHAT HISTORY
        </p>

        {chats.length === 0 && (
          <p className="px-6 py-8 text-center text-slate-400 italic">
            No conversations yet
          </p>
        )}

        <div className="space-y-1 px-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`cursor-pointer group flex items-center justify-between rounded-2xl px-5 py-1 transition-all cursor-pointer ${
                activeChatId === chat.id
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 border border-white/30 shadow-sm"
                  : " bg-gradient-to-r from-indigo-600 to-violet-600 hover:bg-white/10"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex-1 truncate pr-3 text-[15px] font-medium text-white">
                {chat.title || "New Conversation"}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className=" cursor-pointer opacity-0 group-hover:opacity-100 p-2  rounded-xl text-slate-300 hover:text-red-400 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
