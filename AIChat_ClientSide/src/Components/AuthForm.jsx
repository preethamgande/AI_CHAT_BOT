// import { useState } from "react";
// import { loginUser, registerUser } from "../Services/authService";

// export default function AuthForm({ onAuthSuccess }) {
//   const [mode, setMode] = useState("login");
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const isLogin = mode === "login";

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!username.trim() || !password.trim()) {
//       setError("Username and password are required.");
//       return;
//     }

//     if (!isLogin && password.length < 6) {
//       setError("Password must be at least 6 characters.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = isLogin
//         ? await loginUser(username, password)
//         : await registerUser(username, password);

//       if (!response.ok) {
//         const message = await response.text();
//         setError(
//           message ||
//             (isLogin ? "Invalid credentials." : "Registration failed."),
//         );
//         return;
//       }

//       if (isLogin) {
//         onAuthSuccess(username);
//       } else {
//         setUsername("");
//         setPassword("");
//         setMode("login");
//         setError("Registration successful! Please sign in.");
//       }
//     } catch {
//       setError("Connection failed. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
//       <div className="w-full max-w-md">
//         <div className="glass rounded-3xl p-10 shadow-2xl border border-white/10">
//           {/* Logo */}
//           <div className="mb-10 text-center">
//             <div className="mx-auto mb-6 h-16 w-44 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-3xl font-bold text-white shadow-inner">
//               ASK AI
//             </div>
//             <h1 className="text-3xl font-semibold tracking-tight text-black">
//               {isLogin ? "Welcome back" : "Create account"}
//             </h1>
//             <p className="mt-2 text-slate-400 text-sm">
//               {isLogin ? "Sign in to continue" : "Join to start chatting"}
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <input
//                 type="text"
//                 placeholder="Username"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-black placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
//               />
//             </div>

//             <div>
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-black placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
//               />
//             </div>

//             {error && (
//               <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
//                 {error}
//               </div>
//             )}

//             <button
//               disabled={loading}
//               className=" cursor-pointer w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 text-base font-semibold text-white shadow-lg hover:brightness-110 active:scale-[0.985] disabled:opacity-70 transition-all"
//             >
//               {loading
//                 ? "Please wait..."
//                 : isLogin
//                   ? "Sign In"
//                   : "Create Account"}
//             </button>
//           </form>

//           <button
//             onClick={() => {
//               setMode(isLogin ? "register" : "login");
//               setError("");
//             }}
//             className="mt-6 w-full text-sm text-slate-400 hover:text-black cursor-pointer transition-colors"
//           >
//             {isLogin
//               ? "Don't have an account? Create one"
//               : "Already have an account? Sign in"}
//           </button>
//         </div>

//         <p className="text-center text-slate-500 text-xs mt-8">
//           Secure • Private • AI Powered
//         </p>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { loginUser, registerUser } from "../Services/authService";

export default function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    if (!isLogin && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = isLogin
        ? await loginUser(username, password)
        : await registerUser(username, password);

      if (!response.ok) {
        const message = await response.text();
        setError(
          message ||
            (isLogin ? "Invalid credentials." : "Registration failed."),
        );
        return;
      }

      if (isLogin) {
        onAuthSuccess(username);
      } else {
        setUsername("");
        setPassword("");
        setMode("login");
        setSuccess("Registration successful! Please sign in.");
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-10 shadow-2xl border border-white/10">
          {/* Logo */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 h-16 w-44 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center text-3xl font-bold text-white shadow-inner">
              ASK AI
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-black">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>

            <p className="mt-2 text-slate-400 text-sm">
              {isLogin ? "Sign in to continue" : "Join to start chatting"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-black placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-black placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl bg-white border border-green-500/40 p-4 text-sm text-green-600">
                {success}
              </div>
            )}

            <button
              disabled={loading}
              className="cursor-pointer w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 text-base font-semibold text-white shadow-lg hover:brightness-110 active:scale-[0.985] disabled:opacity-70 transition-all"
            >
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(isLogin ? "register" : "login");
              setError("");
              setSuccess("");
            }}
            className="mt-6 w-full text-sm text-slate-400 hover:text-black cursor-pointer transition-colors"
          >
            {isLogin
              ? "Don't have an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
          Secure • Private • AI Powered
        </p>
      </div>
    </div>
  );
}