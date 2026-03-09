function ParticipantItem({ participant, isYou }) {
  const name = participant.name || participant.email || "Anonymous";
  const color = participant.color ?? "#94a3b8";

  return (
    <li className="rounded border border-border bg-slate-800 p-2">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-sm text-slate-100">{isYou ? "You" : name}</span>
      </div>
    </li>
  );
}

export function ParticipantsPanel({ participants = [], currentUserId }) {
  return (
    <aside className="w-64 shrink-0 border-l border-border bg-panel p-3">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-300">
        Participants ({participants.length})
      </h2>
      <ul className="space-y-2">
        {participants.map((participant) => (
          <ParticipantItem
            key={participant.id ?? participant.clientId ?? participant.email ?? Math.random()}
            participant={participant}
            isYou={currentUserId != null && String(participant.id) === String(currentUserId)}
          />
        ))}
        {participants.length === 0 ? (
          <li className="text-xs text-slate-400">No participants yet.</li>
        ) : null}
      </ul>
    </aside>
  );
}
