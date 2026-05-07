import { useEffect, useState } from "react";
import AuthForm from "./Components/AuthForm";
import ChatBox from "./Components/ChatBox";
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";
import { getCurrentUser } from "./Services/authService";
import {
  createChat,
  deleteChat,
  getChatById,
  getChats,
} from "./Services/ChatHistoryService";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Store messages separately for each chat
  const [messagesByChatId, setMessagesByChatId] = useState({});

  const activeMessages = activeChatId
    ? messagesByChatId[activeChatId] || []
    : [];

  const setMessagesForChat = (chatId, updater) => {
    if (!chatId) return;

    setMessagesByChatId((prev) => {
      const currentMessages = prev[chatId] || [];

      const nextMessages =
        typeof updater === "function" ? updater(currentMessages) : updater;

      return {
        ...prev,
        [chatId]: nextMessages || [],
      };
    });
  };

  async function loadChats() {
    try {
      const res = await getChats();

      if (!res.ok) {
        setChats([]);
        return;
      }

      const data = await res.json();
      setChats(data);
    } catch (error) {
      console.error("Failed to load chats:", error);
      setChats([]);
    }
  }

  async function handleNewChat() {
    try {
      const res = await createChat();

      if (!res.ok) {
        const error = await res.text();
        console.error("Create chat failed:", error);
        return;
      }

      const chat = await res.json();
      const newChatId = chat.id || chat._id || chat.Id;

      if (!newChatId) return;

      setActiveChatId(newChatId);

      setMessagesByChatId((prev) => ({
        ...prev,
        [newChatId]: [],
      }));

      await loadChats();
    } catch (error) {
      console.error("New chat error:", error);
    }
  }

  async function handleSelectChat(id) {
    try {
      const res = await getChatById(id);

      if (!res.ok) return;

      const chat = await res.json();
      const selectedChatId = chat.id || chat._id || chat.Id || id;

      setActiveChatId(selectedChatId);

      setMessagesByChatId((prev) => ({
        ...prev,
        [selectedChatId]: Array.isArray(chat.messages) ? chat.messages : [],
      }));
    } catch (error) {
      console.error("Select chat error:", error);
    }
  }

  async function handleDeleteChat(id) {
    try {
      await deleteChat(id);

      setMessagesByChatId((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      if (activeChatId === id) {
        setActiveChatId(null);
      }

      await loadChats();
    } catch (error) {
      console.error("Delete chat error:", error);
    }
  }

  function handleLogout() {
    setUser(null);
    setChats([]);
    setActiveChatId(null);
    setMessagesByChatId({});
  }

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await getCurrentUser();

        if (res.ok) {
          const data = await res.json();
          setUser(data.username);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          <p className="text-sm font-medium text-slate-500">
            Initializing AI...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={(username) => setUser(username)} />;
  }

return (
  <div className="flex h-dvh max-h-dvh w-full max-w-full overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-blue-100 p-0 sm:p-2">
    <Sidebar
      chats={chats}
      activeChatId={activeChatId}
      onNewChat={async () => {
        await handleNewChat();
        setIsSidebarOpen(false);
      }}
      onSelectChat={(id) => {
        handleSelectChat(id);
        setIsSidebarOpen(false);
      }}
      onDeleteChat={handleDeleteChat}
      isOpen={isSidebarOpen}
      onClose={() => setIsSidebarOpen(false)}
    />

    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <Navbar
        username={user}
        onLogout={handleLogout}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      {activeChatId ? (
        <ChatBox
          activeChatId={activeChatId}
          messages={activeMessages}
          setMessagesForChat={setMessagesForChat}
          refreshChats={loadChats}
        />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4">
          <div className="mx-auto max-w-sm rounded-[2rem] border border-white bg-white/60 p-8 text-center shadow-sm backdrop-blur-sm sm:p-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white">
              👋
            </div>

            <h2 className="text-2xl font-bold text-slate-900">
              Ready to chat?
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Select an existing conversation from the sidebar or click
              <span className="font-bold text-slate-700"> “New Chat” </span>
              to start fresh.
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);
  // return (
  //   <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-blue-100 p-2">
  //     <Sidebar
  //       chats={chats}
  //       activeChatId={activeChatId}
  //       onNewChat={handleNewChat}
  //       onSelectChat={handleSelectChat}
  //       onDeleteChat={handleDeleteChat}
  //     />

  //     <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
  //       <Navbar username={user} onLogout={handleLogout} />

  //       {activeChatId ? (
  //         <ChatBox
  //           activeChatId={activeChatId}
  //           messages={activeMessages}
  //           setMessagesForChat={setMessagesForChat}
  //           refreshChats={loadChats}
  //         />
  //       ) : (
  //         <div className="flex flex-1 items-center justify-center px-4">
  //           <div className="max-w-sm rounded-[2.5rem] bg-white/60 p-12 text-center backdrop-blur-sm border border-white shadow-sm">
  //             <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white">
  //               👋
  //             </div>

  //             <h2 className="text-2xl font-bold text-slate-900">
  //               Ready to chat?
  //             </h2>

  //             <p className="mt-3 text-sm leading-relaxed text-slate-500">
  //               Select an existing conversation from the sidebar or click
  //               <span className="font-bold text-slate-700"> “New Chat” </span>
  //               to start fresh.
  //             </p>
  //           </div>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );
}

