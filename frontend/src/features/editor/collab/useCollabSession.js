import { useEffect, useMemo, useRef, useState } from "react";
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
  defaultText = "",
  language,
  onLanguageChangeFromCollab,
  isRoomOwner = false,
  myColorFromApi = null,
}) {
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [isSynced, setIsSynced] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [fallbackColor] = useState(() => randomColor());
  const userColor = myColorFromApi || fallbackColor;
  const yTextRef = useRef(null);
  const setSharedLanguageRef = useRef(null);
  const awarenessRef = useRef(null);
  const languageRef = useRef(language);
  const onLanguageChangeFromCollabRef = useRef(onLanguageChangeFromCollab);
  languageRef.current = language;
  onLanguageChangeFromCollabRef.current = onLanguageChangeFromCollab;

  const userMeta = useMemo(
    () => ({
      name: username?.trim() || "Anonymous",
      color: userColor,
      isTyping: false,
    }),
    [username, userColor],
  );
  const userMetaRef = useRef(userMeta);
  userMetaRef.current = userMeta;

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

    const yMeta = ydoc.getMap("meta");
    const observer = () => {
      const newLanguage = yMeta.get("language");
      if (typeof newLanguage === "string") {
        onLanguageChangeFromCollabRef.current?.(newLanguage);
      }
    };
    yMeta.observe(observer);
    const setSharedLanguage = (lang) => {
      if (typeof lang === "string") yMeta.set("language", lang);
    };
    setSharedLanguageRef.current = setSharedLanguage;

    const awareness = provider.awareness;
    awarenessRef.current = awareness;
    awareness.setLocalStateField("user", userMetaRef.current);

    model.setEOL(monaco.editor.EndOfLineSequence.LF);

    yTextRef.current = yText;

    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      awareness,
    );

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
      if (synced && yText.length === 0 && defaultText) {
        yText.insert(0, defaultText);
      }
      if (
        synced &&
        !yMeta.get("language") &&
        typeof languageRef.current === "string"
      ) {
        yMeta.set("language", languageRef.current);
      }
      if (synced && typeof yMeta.get("language") === "string") {
        onLanguageChangeFromCollabRef.current?.(yMeta.get("language"));
      }
    };

    const onAwarenessChange = () => {
      setParticipants(normalizeAwarenessStates(awareness.getStates()));
    };

    provider.on("status", onStatus);
    provider.on("sync", onSynced);
    awareness.on("change", onAwarenessChange);
    onAwarenessChange();

    const styleId = "y-remote-cursors";
    const updateCursorStyles = () => {
      const states = awareness.getStates();
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();
      const sheet = document.createElement("style");
      sheet.id = styleId;
      states.forEach((state, clientId) => {
        const color = state.user?.color ?? "#94a3b8";
        sheet.textContent += `
        .yRemoteSelection-${clientId} { background-color: ${color}40; }
        .yRemoteSelectionHead-${clientId} {
          position: absolute;
          border-left: 2px solid ${color};
          border-top: 2px solid ${color};
          border-bottom: 2px solid ${color};
          height: 100%;
          box-sizing: border-box;
        }
        .yRemoteSelectionHead-${clientId}::after {
          position: absolute;
          content: " ";
          border: 2px solid ${color};
          border-radius: 2px;
          left: -3px;
          top: -4px;
          background: ${color};
        }
        `;
      });
      document.head.appendChild(sheet);
    };
    awareness.on("change", updateCursorStyles);
    updateCursorStyles();

    let typingTimer;
    const contentListener = editor.onDidChangeModelContent(() => {
      awareness.setLocalStateField("user", { ...userMetaRef.current, isTyping: true });
      window.clearTimeout(typingTimer);
      typingTimer = window.setTimeout(() => {
        awareness.setLocalStateField("user", { ...userMetaRef.current, isTyping: false });
      }, 700);
    });

    return () => {
      window.clearTimeout(typingTimer);
      awarenessRef.current = null;
      yMeta.unobserve(observer);
      contentListener.dispose();
      awareness.off("change", onAwarenessChange);
      awareness.off("change", updateCursorStyles);
      const styleEl = document.getElementById(styleId);
      if (styleEl) styleEl.remove();
      provider.off("status", onStatus);
      provider.off("sync", onSynced);
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
      yTextRef.current = null;
      setSharedLanguageRef.current = null;
      setIsSynced(false);
      setParticipants([]);
      setConnectionStatus("offline");
    };
  }, [editor, model, monaco, roomName, token, wsUrl]);

  useEffect(() => {
    awarenessRef.current?.setLocalStateField("user", userMeta);
  }, [userMeta]);

  useEffect(() => {
    if (!isRoomOwner || !yTextRef.current || !defaultText) return;
    const yText = yTextRef.current;
    const len = yText.length;
    if (len > 0) yText.delete(0, len);
    yText.insert(0, defaultText);
  }, [defaultText, isRoomOwner]);

  const setSharedLanguage = (lang) => {
    setSharedLanguageRef.current?.(lang);
  };

  return {
    connectionStatus,
    isSynced,
    participants,
    setSharedLanguage,
  };
}
