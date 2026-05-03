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
  const [messages, setMessages] = useState([]);

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
      setMessages([]);
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
      setActiveChatId(chat.id || chat._id || chat.Id);
      setMessages(chat.messages || []);
    } catch (error) {
      console.error("Select chat error:", error);
    }
  }

  async function handleDeleteChat(id) {
    try {
      await deleteChat(id);
      if (activeChatId === id) {
        setActiveChatId(null);
        setMessages([]);
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
    setMessages([]);
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
    if (user) loadChats();
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
    /* 
       MAIN WRAPPER: 
       - Applied the Soft Studio Gradient (slate-50 to blue-100)
       - Added p-2 (padding) to show off the rounded corners of Sidebar and ChatBox
    */
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-blue-100 p-2">
      {/* SIDEBAR: Inherits your specific high-radius styling */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* NAVBAR: Sits inside the flex column */}
        <Navbar username={user} onLogout={handleLogout} />

        {activeChatId ? (
          <ChatBox
            activeChatId={activeChatId}
            messages={messages}
            setMessages={setMessages}
            refreshChats={loadChats}
          />
        ) : (
          /* PLACEHOLDER: Styled to match the Bento aesthetic */
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="max-w-sm rounded-[2.5rem] bg-white/60 p-12 text-center backdrop-blur-sm border border-white shadow-sm">
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
}

// import { useEffect, useState } from "react";

// import AuthForm from "./Components/AuthForm";

// import ChatBox from "./Components/ChatBox";

// import Navbar from "./Components/Navbar";

// import Sidebar from "./Components/Sidebar";

// import { getCurrentUser } from "./Services/authService";

// import {
//   createChat,
//   deleteChat,
//   getChatById,
//   getChats,
// } from "./Services/chatHistoryService";

// export default function App() {
//   const [user, setUser] = useState(null);

//   const [checkingAuth, setCheckingAuth] = useState(true);

//   const [chats, setChats] = useState([]);

//   const [activeChatId, setActiveChatId] = useState(null);

//   const [messages, setMessages] = useState([]);

//   async function loadChats() {
//     try {
//       const res = await getChats();

//       if (!res.ok) {
//         setChats([]);

//         return;
//       }

//       const data = await res.json();

//       setChats(data);
//     } catch (error) {
//       console.error("Failed to load chats:", error);

//       setChats([]);
//     }
//   }

//   async function handleNewChat() {
//     try {
//       const res = await createChat();

//       if (!res.ok) {
//         const error = await res.text();

//         console.error("Create chat failed:", error);

//         return;
//       }

//       const chat = await res.json();

//       console.log("Created chat from backend:", chat);

//       const newChatId = chat.id || chat._id || chat.Id;

//       if (!newChatId) {
//         console.error("Chat id missing:", chat);

//         return;
//       }

//       setActiveChatId(newChatId);

//       setMessages([]);

//       await loadChats();
//     } catch (error) {
//       console.error("New chat error:", error);
//     }
//   }

//   async function handleSelectChat(id) {
//     try {
//       const res = await getChatById(id);

//       if (!res.ok) {
//         console.error("Failed to load selected chat");

//         return;
//       }

//       const chat = await res.json();

//       setActiveChatId(chat.id || chat._id || chat.Id);

//       setMessages(chat.messages || []);
//     } catch (error) {
//       console.error("Select chat error:", error);
//     }
//   }

//   async function handleDeleteChat(id) {
//     try {
//       await deleteChat(id);

//       if (activeChatId === id) {
//         setActiveChatId(null);

//         setMessages([]);
//       }

//       await loadChats();
//     } catch (error) {
//       console.error("Delete chat error:", error);
//     }
//   }

//   function handleLogout() {
//     setUser(null);

//     setChats([]);

//     setActiveChatId(null);

//     setMessages([]);
//   }

//   useEffect(() => {
//     async function checkAuth() {
//       try {
//         const res = await getCurrentUser();

//         if (res.ok) {
//           const data = await res.json();

//           setUser(data.username);
//         }
//       } catch (error) {
//         console.error("Auth check failed:", error);

//         setUser(null);
//       } finally {
//         setCheckingAuth(false);
//       }
//     }

//     checkAuth();
//   }, []);

//   useEffect(() => {
//     if (user) {
//       loadChats();
//     }
//   }, [user]);

//   if (checkingAuth) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-slate-100">
//         <p className="text-sm text-slate-600">Checking session...</p>
//       </div>
//     );
//   }

//   if (!user) {
//     return <AuthForm onAuthSuccess={(username) => setUser(username)} />;
//   }

//   return (
//     <div className="flex h-screen overflow-hidden bg-slate-50">
//       <Sidebar
//         chats={chats}
//         activeChatId={activeChatId}
//         onNewChat={handleNewChat}
//         onSelectChat={handleSelectChat}
//         onDeleteChat={handleDeleteChat}
//       />

//       <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
//         <Navbar username={user} onLogout={handleLogout} />

//         {activeChatId ? (
//           <ChatBox
//             activeChatId={activeChatId}
//             messages={messages}
//             setMessages={setMessages}
//             refreshChats={loadChats}
//           />
//         ) : (
//           <div className="flex flex-1 items-center justify-center px-4">
//             <div className="rounded-3xl bg-white px-10 py-12 text-center shadow-sm">
//               <h2 className="text-xl font-semibold text-slate-900">
//                 Start a new chat
//               </h2>

//               <p className="mt-2 text-sm text-slate-500">
//                 Click “New Chat” from the sidebar to begin.
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
