import { Link } from "react-router-dom";

const languages = ["javascript", "typescript", "python", "go", "cpp", "json"];

export function Toolbar({
  roomCode,
  language,
  onLanguageChange,
  userDisplayName,
  onLogout,
  onRun,
  runLoading,
  isRoomOwner,
}) {
  return (
    <header className="flex items-center justify-between border-b border-border-subtle bg-surface-elevated px-4 py-2.5">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="text-sm font-semibold tracking-tight text-zinc-200 hover:text-white"
        >
          Collab Editor
        </Link>
        <span className="rounded-xl bg-panel px-2.5 py-1.5 font-mono text-xs text-zinc-300">
          {roomCode}
        </span>
        {onRun ? (
          <button
            type="button"
            onClick={onRun}
            disabled={runLoading}
            className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
          >
            {runLoading ? "Запуск…" : "Запуск"}
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          Язык
          <select
            className="rounded-xl border border-border bg-panel px-3 py-2 text-xs text-zinc-100 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            disabled={!isRoomOwner}
          >
            {languages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <span className="text-xs text-zinc-500">{userDisplayName}</span>
        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-border bg-panel px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-panel-hover hover:text-zinc-100"
          >
            Выйти
          </button>
        ) : null}
      </div>
    </header>
  );
}
