export function RunOutputPanel({ output, error, loading, onClose }) {
  if (!loading && !output && !error) return null;

  return (
    <div className="flex flex-col border-t border-border-subtle bg-surface-elevated">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Вывод
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 transition hover:bg-panel hover:text-zinc-200"
          >
            Закрыть
          </button>
        ) : null}
      </div>
      <div className="max-h-48 min-h-[4rem] overflow-auto p-4 font-mono text-xs leading-relaxed text-zinc-200">
        {loading && <p className="text-zinc-500">Запуск…</p>}
        {error && <p className="text-red-400">{error}</p>}
        {output && !error && (
          <pre className="whitespace-pre-wrap break-words">{output}</pre>
        )}
      </div>
    </div>
  );
}
