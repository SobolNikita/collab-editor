const connectionClassMap = {
  connecting: "bg-amber-500",
  connected: "bg-emerald-500",
  reconnecting: "bg-amber-500",
  offline: "bg-rose-500",
};

export function StatusBar({ connectionStatus, isSynced, roomName }) {
  const dotClass = connectionClassMap[connectionStatus] ?? "bg-slate-500";

  return (
    <footer className="flex items-center justify-between border-t border-border bg-panel px-4 py-2 text-xs text-slate-300">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
        <span>Connection: {connectionStatus}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>Room: {roomName}</span>
        <span>{isSynced ? "Synced" : "Syncing..."}</span>
      </div>
    </footer>
  );
}
