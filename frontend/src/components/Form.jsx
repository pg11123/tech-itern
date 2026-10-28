
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

export default function Form() {
  const isRegister = useLocation().pathname === "/register";
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `/api/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Coś poszło nie tak.");
      }

      if (isRegister) {
        navigate("/login");
      } else {
        navigate("/game");
      }
    } catch (err) {
      setError(err.message || "Nie udało się połączyć z serwerem.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold">
          {isRegister ? "Stwórz konto" : "Witaj ponownie"}
        </h1>

        <p className="mb-8 text-center text-slate-400">
          {isRegister
            ? "Dołącz do świata gry."
            : "Zaloguj się i kontynuuj przygodę."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400"
            >
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium"
            >
              Nazwa gracza
            </label>

            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={24}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-500"
              placeholder="Wpisz nazwę gracza"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Hasło
            </label>

            <input
              id="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={isRegister ? 8 : undefined}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-500"
              placeholder="Wpisz hasło"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 px-4 py-3 font-bold transition hover:bg-violet-500 disabled:opacity-50"
          >
            {loading
              ? "Chwileczkę..."
              : isRegister
                ? "Zarejestruj się"
                : "Zaloguj się"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isRegister ? "Masz już konto?" : "Nie masz jeszcze konta?"}{" "}
          <Link
            to={isRegister ? "/login" : "/register"}
            className="font-semibold text-violet-400 hover:text-violet-300"
          >
            {isRegister ? "Zaloguj się" : "Zarejestruj się"}
          </Link>
        </p>
      </section>
    </main>
  );
}
