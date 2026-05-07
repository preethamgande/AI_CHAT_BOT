import { Menu } from "lucide-react";
import { logoutUser } from "../Services/authService";

export default function Navbar({ username, onLogout, onMenuClick }) {
  const handleLogout = async () => {
    await logoutUser();
    onLogout();
  };

  return (
    <header className="mb-2 mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:mb-4 sm:mt-4 sm:rounded-[2rem] sm:px-8 sm:py-4 md:mx-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Hamburger - mobile only */}
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              ASK AI Chat
            </h1>

            <p className="truncate text-xs font-medium text-slate-500">
              Logged in as:{" "}
              <span className="text-slate-800">{username}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg cursor-pointer border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 active:scale-95 sm:px-5 sm:text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

// import { logoutUser } from "../Services/authService";

// export default function Navbar({ username, onLogout }) {
//   const handleLogout = async () => {
//     await logoutUser();
//     onLogout();
//   };

//   return (
//     <header className="mb-4 rounded-[2rem] border border-slate-200 bg-white px-8 py-4 shadow-sm mt-4 mx-4">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-lg font-bold tracking-tight text-slate-900">
//             ASK AI Chat
//           </h1>
//           <p className="text-xs font-medium text-slate-500">
//             LoggedIn as: <span className="text-slate-800">{username}</span>
//           </p>
//         </div>

//         <button
//           onClick={handleLogout}
//           className="rounded-lg cursor-pointer border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 active:scale-95"
//         >
//           Logout
//         </button>
//       </div>
//     </header>
//   );
// }
