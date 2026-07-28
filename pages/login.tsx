import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { NextPage } from "next";
import { fetchSessionUser, getRoleHomePath, getStoredToken, setStoredToken } from "../lib/session";

const DEMO_ACCOUNTS = [
  {
    label: "Super Admin",
    username: "demo_admin",
    password: "demo12345",
  },
  {
    label: "Province User",
    username: "demo_kandal",
    password: "demo12345",
  },
];

const Login: NextPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const checkExistingSession = async () => {
      const token = getStoredToken();
      if (!token) {
        if (!isCancelled) {
          setIsCheckingSession(false);
        }
        return;
      }

      const user = await fetchSessionUser(token);
      if (!user) {
        if (!isCancelled) {
          setIsCheckingSession(false);
        }
        return;
      }

      if (!isCancelled) {
        await router.replace(getRoleHomePath(user.role));
      }
    };

    void checkExistingSession();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setStoredToken(data.token);
        const sessionUser = await fetchSessionUser(data.token);
        const targetPath = sessionUser ? getRoleHomePath(sessionUser.role) : getRoleHomePath(String(data.role ?? "user"));
        await router.push(targetPath);
      } else {
        setError(data.error ?? "Login failed");
      }
    } catch {
      setError("Unable to reach login service.");
    } finally {
      setIsLoading(false);
    }
  };

  const useDemoCredentials = (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError("");
  };

  if (isCheckingSession) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#020617_45%,_#020617_100%)]" />
        <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-10 sm:px-8">
          <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm text-slate-200 backdrop-blur">
            Checking session...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#020617_45%,_#020617_100%)]" />
      <div className="pointer-events-none absolute -left-20 top-16 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-16 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-10 sm:px-8">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-white/5 shadow-[0_40px_120px_-40px_rgba(15,23,42,0.85)] backdrop-blur-md lg:grid-cols-2">
          <div className="flex flex-col justify-between border-b border-white/10 p-8 sm:p-12 lg:border-b-0 lg:border-r">
            <div>
              <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                WRAM Insights
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
                Login to your reporting workspace
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
                Track, submit, and review reports from one secure dashboard designed for departments and teams.
              </p>
            </div>

            <div className="mt-10 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm text-emerald-100 sm:p-5">
              <p className="font-semibold">Quick demo access</p>
              <p className="mt-2 text-emerald-100/90">Password for all demo accounts: demo12345</p>
              <div className="mt-4 space-y-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => useDemoCredentials(account.username, account.password)}
                    className="flex w-full items-center justify-between rounded-xl border border-emerald-200/40 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-100 transition hover:bg-emerald-300/20"
                  >
                    <span>{account.label}</span>
                    <span className="text-emerald-100/80">{account.username}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            <h2 className="text-2xl font-semibold text-white">Sign in</h2>
            <p className="mt-2 text-sm text-slate-300">Use your account to continue.</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-200">
                  Username
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-300/75 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                  Password
                </label>
                <input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-300/75 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-rose-200/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-900 transition hover:from-cyan-300 hover:to-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
