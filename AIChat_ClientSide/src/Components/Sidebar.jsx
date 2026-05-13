import { Trash2, X, UserCircle } from "lucide-react";

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  username,
  isOpen = false,
  onClose,
}) {
  return (
    <>
      {/* Mobile / Tablet Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 m-0 flex h-dvh w-[82vw] max-w-80 shrink-0 flex-col overflow-hidden rounded-none border border-white/60 bg-white/75 shadow-2xl backdrop-blur-xl transition-transform duration-300 lg:static lg:m-4 lg:h-[calc(100dvh-2rem)] lg:translate-x-0 lg:rounded-3xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile / Tablet Header */}
        <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 lg:hidden">
          <h2 className="text-sm font-bold tracking-wide text-slate-900">
            ASK AI
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="shrink-0 p-5 sm:p-6">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:brightness-110 active:scale-[0.97]"
          >
            NEW CHAT
          </button>
        </div>

        {/* Chat History Section */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          <p className="mb-4 px-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            CHAT HISTORY
          </p>

          {chats.length === 0 && (
            <p className="px-6 py-8 text-center text-slate-400 italic">
              No conversations yet
            </p>
          )}

          <div className="space-y-2 px-2">
            {chats.map((chat) => {
              const isActive = activeChatId === chat.id;

              return (
                <div
                  key={chat.id}
                  className={`group flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition-all ${
                    isActive
                      ? "border-white/30 bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm"
                      : "border-white/60 bg-white/60 hover:bg-white/90"
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <div
                    className={`flex-1 truncate pr-3 text-[15px] font-medium ${
                      isActive ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {chat.title || "New Conversation"}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className={`cursor-pointer rounded-xl p-2 opacity-100 transition-all lg:opacity-0 lg:group-hover:opacity-100 ${
                      isActive
                        ? "text-white/80 hover:text-red-200"
                        : "text-slate-400 hover:text-red-500"
                    }`}
                    aria-label="Delete chat"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Info Bottom Section */}
        <div className="shrink-0 border-t border-slate-200/70 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <UserCircle size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Logged in as
              </p>

              <p className="truncate text-sm font-semibold text-slate-800">
                {username || "User"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

