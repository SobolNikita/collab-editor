function ParticipantItem({ participant }) {
  return (
    <li className="rounded border border-border bg-slate-800 p-2">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: participant.color }}
        />
        <span className="text-sm text-slate-100">{participant.name}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {participant.isTyping ? "Typing..." : "Idle"}
      </p>
    </li>
  );
}

export function ParticipantsPanel({ participants }) {
  return (
    <aside className="w-64 border-l border-border bg-panel p-3">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-300">
        Online ({participants.length})
      </h2>
      <ul className="space-y-2">
        {participants.map((participant) => (
          <ParticipantItem
            key={participant.clientId}
            participant={participant}
          />
        ))}
        {participants.length === 0 ? (
          <li className="text-xs text-slate-400">No collaborators yet.</li>
        ) : null}
      </ul>
    </aside>
  );
}
