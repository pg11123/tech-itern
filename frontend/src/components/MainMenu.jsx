
import { useNavigate } from "react-router";

export default function MainMenu({ onLogin, onRegister }) {

  const navigate = useNavigate();

  return (
    <main className="page">
      <div className="panel">
        <header className="panel-header">
          <p className="eyebrow">
            YOUR LEGEND BEGINS
          </p>

          <h1 className="font-serif text-5xl text-red-700 font-bold tracking-widest">
            ANGRY
            <span className="mt-3 block text-amber-500">
              ROGUE
            </span>
          </h1>

          <p className="mt-5 text-sm text-stone-500">
            Świat czeka na Twoją historię.
          </p>
        </header>

        <div className="stack">
          <button
            onClick={() => navigate("/register")}
            className="btn btn-primary"
          >
            Stwórz konto
          </button>

          <button
            onClick={() => navigate("/login")}
            className="btn btn-secondary"
          >
            Zaloguj się
          </button>
        </div>

        <p className="panel-footer">
          Stwórz konto w celu rozpoczęcia swojej przygody
        </p>
      </div>
    </main>
  );
}
