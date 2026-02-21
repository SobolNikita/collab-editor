export function RunOutputPanel({ output, error, loading, onClose }) {
  if (!loading && !output && !error) return null;

  return (
    <div className="flex flex-col border-t border-border bg-panel">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Output
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Close
          </button>
        ) : null}
      </div>
      <div className="max-h-48 min-h-[4rem] overflow-auto p-3 font-mono text-xs text-slate-200">
        {loading && <p className="text-slate-400">Running…</p>}
        {error && <p className="text-red-400">{error}</p>}
        {output && !error && (
          <pre className="whitespace-pre-wrap break-words">{output}</pre>
        )}
      </div>
    </div>
  );
}
