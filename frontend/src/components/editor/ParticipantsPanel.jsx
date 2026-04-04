function ParticipantItem({ participant, isYou }) {
  const name = participant.name || participant.email || "Anonymous";
  const color = participant.color ?? "#94a3b8";

  return (
    <li className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-elevated px-3 py-2.5">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="truncate text-sm font-medium text-zinc-100">
        {isYou ? "Вы" : name}
      </span>
    </li>
  );
}

export function ParticipantsPanel({ participants = [], currentUserId }) {
  return (
    <aside className="w-64 shrink-0 border-l border-border-subtle bg-surface-elevated p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Участники ({participants.length})
      </h2>
      <ul className="space-y-2">
        {participants.map((participant, index) => (
          <ParticipantItem
            key={String(
              participant.id ??
                participant.user_id ??
                participant.clientId ??
                participant.email ??
                `participant-${index}`,
            )}
            participant={participant}
            isYou={currentUserId != null && String(participant.id) === String(currentUserId)}
          />
        ))}
        {participants.length === 0 ? (
          <li className="rounded-xl bg-panel/50 px-3 py-4 text-center text-xs text-zinc-500">
            Пока никого
          </li>
        ) : null}
      </ul>
    </aside>
  );
}
