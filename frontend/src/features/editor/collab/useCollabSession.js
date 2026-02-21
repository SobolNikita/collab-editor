import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

function randomColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 60%)`;
}

function normalizeAwarenessStates(statesMap) {
  return Array.from(statesMap.entries()).map(([clientId, state]) => ({
    clientId,
    name: state.user?.name ?? "Anonymous",
    color: state.user?.color ?? "#94a3b8",
    isTyping: Boolean(state.user?.isTyping),
  }));
}

export function useCollabSession({
  wsUrl,
  roomName,
  monaco,
  editor,
  model,
  username,
  token = "",
}) {
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isSynced, setIsSynced] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [userColor] = useState(() => randomColor());

  const userMeta = useMemo(
    () => ({
      name: username?.trim() || "Anonymous",
      color: userColor,
      isTyping: false,
    }),
    [username, userColor],
  );

  useEffect(() => {
    if (!monaco || !editor || !model || !wsUrl || !roomName) {
      return undefined;
    }

    const ydoc = new Y.Doc();
    const yText = ydoc.getText("content");
    const provider = new WebsocketProvider(wsUrl, roomName, ydoc, {
      connect: true,
      params: token ? { token } : undefined,
    });

    const awareness = provider.awareness;
    awareness.setLocalStateField("user", userMeta);

    const binding = new MonacoBinding(yText, model, new Set([editor]), awareness);

    const onStatus = ({ status }) => {
      if (status === "connected") {
        setConnectionStatus("connected");
      } else if (status === "connecting") {
        setConnectionStatus((prev) =>
          prev === "connected" ? "reconnecting" : "connecting",
        );
      } else {
        setConnectionStatus("offline");
      }
    };

    const onSynced = (synced) => {
      setIsSynced(Boolean(synced));
      setConnectionStatus((prev) =>
        prev === "connected" && !synced ? "reconnecting" : prev,
      );
    };

    const onAwarenessChange = () => {
      setParticipants(normalizeAwarenessStates(awareness.getStates()));
    };

    provider.on("status", onStatus);
    provider.on("sync", onSynced);
    awareness.on("change", onAwarenessChange);
    onAwarenessChange();

    let typingTimer;
    const contentListener = editor.onDidChangeModelContent(() => {
      awareness.setLocalStateField("user", { ...userMeta, isTyping: true });
      window.clearTimeout(typingTimer);
      typingTimer = window.setTimeout(() => {
        awareness.setLocalStateField("user", { ...userMeta, isTyping: false });
      }, 700);
    });

    return () => {
      window.clearTimeout(typingTimer);
      contentListener.dispose();
      awareness.off("change", onAwarenessChange);
      provider.off("status", onStatus);
      provider.off("sync", onSynced);
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
      setIsSynced(false);
      setParticipants([]);
      setConnectionStatus("offline");
    };
  }, [editor, model, monaco, roomName, token, userMeta, wsUrl]);

  return {
    connectionStatus,
    isSynced,
    participants,
  };
}
