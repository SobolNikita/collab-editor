const connectionClassMap = {
  connecting: "bg-amber-400",
  connected: "bg-emerald-400",
  reconnecting: "bg-amber-400",
  offline: "bg-red-400",
};

export function StatusBar({ connectionStatus, isSynced, roomName }) {
  const dotClass = connectionClassMap[connectionStatus] ?? "bg-zinc-500";

  return (
    <footer className="flex items-center justify-between border-t border-border-subtle bg-surface-elevated px-4 py-2 text-xs text-zinc-400">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
        <span>{connectionStatus === "connected" ? "Подключено" : connectionStatus === "connecting" ? "Подключение…" : connectionStatus === "reconnecting" ? "Переподключение…" : "Нет связи"}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-zinc-500">{roomName}</span>
        <span>{isSynced ? "Синхронизировано" : "Синхронизация…"}</span>
      </div>
    </footer>
  );
}
