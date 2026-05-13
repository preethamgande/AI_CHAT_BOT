import { useState } from "react";
import {
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
} from "../Services/authService";

export default function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [resetToken, setResetToken] = useState("");
  const [resetLink, setResetLink] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgotPassword = mode === "forgot";
  const isResetPassword = mode === "reset";

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    clearMessages();
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
    setResetLink("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    setLoading(true);

    try {
      if (isLogin) {
        if (!username.trim() || !password.trim()) {
          setError("Username and password are required.");
          return;
        }

        const response = await loginUser(username, password);

        if (!response.ok) {
          const message = await response.text();
          setError(message || "Invalid credentials.");
          return;
        }

        onAuthSuccess(username);
        return;
      }

      if (isRegister) {
        if (!username.trim() || !email.trim() || !password.trim()) {
          setError("Username, email and password are required.");
          return;
        }

        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }

        const response = await registerUser(username, email, password);

        if (!response.ok) {
          const message = await response.text();
          setError(message || "Registration failed.");
          return;
        }

        setUsername("");
        setEmail("");
        setPassword("");
        setMode("login");
        setSuccess("Registration successful! Please sign in.");
        return;
      }

      if (isForgotPassword) {
        if (!email.trim()) {
          setError("Email is required.");
          return;
        }

        const response = await forgotPassword(email);

        if (!response.ok) {
          const message = await response.text();
          setError(message || "Failed to generate reset link.");
          return;
        }

        const data = await response.json();

        setSuccess(data.message || "Password reset link generated.");

        // Development testing only: backend returns resetLink
        if (data.resetLink) {
          setResetLink(data.resetLink);

          const url = new URL(data.resetLink);
          const tokenFromUrl = url.searchParams.get("token");

          if (tokenFromUrl) {
            setResetToken(tokenFromUrl);
            setMode("reset");
            setSuccess("Reset token received. Please enter your new password.");
          }
        }

        return;
      }

      if (isResetPassword) {
        if (
          !email.trim() ||
          !resetToken.trim() ||
          !newPassword.trim() ||
          !confirmPassword.trim()
        ) {
          setError("All fields are required.");
          return;
        }

        if (newPassword !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        if (newPassword.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }

        const response = await resetPassword(
          email,
          resetToken,
          newPassword,
          confirmPassword,
        );

        if (!response.ok) {
          const message = await response.text();
          setError(message || "Password reset failed.");
          return;
        }

        setEmail("");
        setResetToken("");
        setNewPassword("");
        setConfirmPassword("");
        setMode("login");
        setSuccess("Password reset successful! Please sign in.");
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (isLogin) return "Welcome back";
    if (isRegister) return "Create account";
    if (isForgotPassword) return "Forgot password";
    return "Reset password";
  };

  const getSubtitle = () => {
    if (isLogin) return "Sign in to continue";
    if (isRegister) return "Join to start chatting";
    if (isForgotPassword) return "Enter your registered email";
    return "Create a new password";
  };

  const getButtonText = () => {
    if (loading) return "Please wait...";
    if (isLogin) return "Sign In";
    if (isRegister) return "Create Account";
    if (isForgotPassword) return "Generate Reset Link";
    return "Reset Password";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl border border-white/10 p-10 shadow-2xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-44 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-3xl font-bold text-white shadow-inner">
              ASK AI
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-black">
              {getTitle()}
            </h1>

            <p className="mt-2 text-sm text-slate-400">{getSubtitle()}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {(isLogin || isRegister) && (
              <div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-black outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            {(isRegister || isForgotPassword || isResetPassword) && (
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-black outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            {(isLogin || isRegister) && (
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-black outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            {isResetPassword && (
              <>
                <div>
                  <input
                    type="text"
                    placeholder="Reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-black outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-black outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-black outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-green-500/40 bg-white p-4 text-sm text-green-600">
                {success}
              </div>
            )}

            {/* {resetLink && (
              <div className="break-all rounded-2xl border border-indigo-500/30 bg-indigo-50 p-4 text-xs text-indigo-700">
                <p className="mb-1 font-semibold">Development reset link:</p>
                {resetLink}
              </div>
            )} */}

            <button
              disabled={loading}
              className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 text-base font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.985] disabled:opacity-70"
            >
              {getButtonText()}
            </button>
          </form>

          {isLogin && (
            <button
              onClick={() => switchMode("forgot")}
              className="mt-5 w-full cursor-pointer text-sm text-indigo-600 transition-colors hover:text-indigo-800"
            >
              Forgot password?
            </button>
          )}

          <button
            onClick={() => {
              if (isLogin) switchMode("register");
              else switchMode("login");
            }}
            className="mt-5 w-full cursor-pointer text-sm text-slate-400 transition-colors hover:text-black"
          >
            {isLogin
              ? "Don't have an account? Create one"
              : "Back to sign in"}
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Secure • Private • AI Powered
        </p>
      </div>
    </div>
  );
}


// import { useState } from "react";
// import { loginUser, registerUser } from "../Services/authService";

// export default function AuthForm({ onAuthSuccess }) {
//   const [mode, setMode] = useState("login");
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);

//   const isLogin = mode === "login";

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");

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
//         setSuccess("Registration successful! Please sign in.");
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

//             {success && (
//               <div className="rounded-2xl bg-white border border-green-500/40 p-4 text-sm text-green-600">
//                 {success}
//               </div>
//             )}

//             <button
//               disabled={loading}
//               className="cursor-pointer w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 text-base font-semibold text-white shadow-lg hover:brightness-110 active:scale-[0.985] disabled:opacity-70 transition-all"
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
//               setSuccess("");
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



