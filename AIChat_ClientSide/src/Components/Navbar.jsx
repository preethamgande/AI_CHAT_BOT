import { logoutUser } from "../Services/authService";

export default function Navbar({ username, onLogout }) {
  const handleLogout = async () => {
    await logoutUser();
    onLogout();
  };

  return (
    <header className="mb-4 rounded-[2rem] border border-slate-200 bg-white px-8 py-4 shadow-sm mt-4 mx-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            ASK AI Chat
          </h1>
          <p className="text-xs font-medium text-slate-500">
            LoggedIn as: <span className="text-slate-800">{username}</span>
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg cursor-pointer border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 active:scale-95"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
