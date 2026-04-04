import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../app/authContext.js";
import { Toolbar } from "../components/editor/Toolbar.jsx";
import { ParticipantsPanel } from "../components/editor/ParticipantsPanel.jsx";
import { RunOutputPanel } from "../components/editor/RunOutputPanel.jsx";
import { StatusBar } from "../components/editor/StatusBar.jsx";
import { EditorWorkspace } from "../features/editor/EditorWorkspace.jsx";
import { getEnv } from "../app/env.js";
import { isOwner } from "../shared/api/permissions.js";
import { getRoomParticipants, checkRoomAccess } from "../shared/api/roomApi.js";

const RUNNABLE_LANGUAGES = new Set([
  "javascript",
  "typescript",
  "python",
  "go",
  "cpp",
]);

export function EditorPage() {
  const { shortCode: shortCodeParam = "" } = useParams();
  const navigate = useNavigate();
  const { user, token, logout: authLogout } = useAuth();
  const [language, setLanguage] = useState("javascript");
  const [status, setStatus] = useState({
    connectionStatus: "connecting",
    isSynced: false,
  });
  const roomCode = shortCodeParam.trim() || null;
  const [runOutput, setRunOutput] = useState("");
  const [runError, setRunError] = useState("");
  const [runLoading, setRunLoading] = useState(false);
  const [runPanelOpen, setRunPanelOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [accessStatus, setAccessStatus] = useState("pending"); // pending | allowed | denied

  const workspaceRef = useRef(null);
  const env = useMemo(() => getEnv(), []);

  const myColorFromApi = useMemo(() => {
    const p = participants.find(
      (pr) => String(pr.user_id) === String(user?.id),
    );
    return p?.color || null;
  }, [participants, user?.id]);

  const [isRoomOwner, setIsRoomOwner] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkOwner() {
      try {
        const result = await isOwner(roomCode);
        if (isMounted) {
          setIsRoomOwner(result);
        }
      } catch (error) {
        console.error("Error while checking permissions:", error);
        if (isMounted) setIsRoomOwner(false);
      }
    }

    if (roomCode) {
      checkOwner();
    }

    return () => {
      isMounted = false;
    };
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode || !env.apiUrl || !token || !user?.id) {
      setAccessStatus("denied");
      return;
    }
    let cancelled = false;
    checkRoomAccess(roomCode, user.id).then((allowed) => {
      if (!cancelled) setAccessStatus(allowed ? "allowed" : "denied");
    });
    return () => {
      cancelled = true;
    };
  }, [roomCode, env.apiUrl, token, user?.id]);

  useEffect(() => {
    if (!roomCode || !env.apiUrl || !token) {
      setParticipants([]);
      return;
    }
    let cancelled = false;
    getRoomParticipants(roomCode)
      .then(({ participants: list }) => {
        if (cancelled) return;
        setParticipants(list ?? []);
      })
      .catch(() => {
        if (!cancelled) setParticipants([]);
      });
    return () => {
      cancelled = true;
    };
  }, [roomCode, env.apiUrl, token]);

  useEffect(() => {
    if (!roomCode || !env.apiUrl || !token || accessStatus !== "allowed")
      return;
    const id = setInterval(() => {
      getRoomParticipants(roomCode)
        .then(({ participants: list }) => setParticipants(list ?? []))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [roomCode, env.apiUrl, token, accessStatus]);

  const handleStatusChange = useCallback((nextStatus) => {
    setStatus(nextStatus);
  }, []);

  const handleLanguageChange = useCallback(
    (newLang) => {
      setLanguage(newLang);
      if (isRoomOwner) {
        workspaceRef.current?.setSharedLanguage?.(newLang);
      }
    },
    [isRoomOwner],
  );

  const handleLogout = useCallback(() => {
    authLogout();
    navigate("/login", { replace: true });
  }, [authLogout, navigate]);

  const handleRun = useCallback(async () => {
    const content = workspaceRef.current?.getContent?.() ?? "";
    if (!RUNNABLE_LANGUAGES.has(language)) {
      setRunError("Run is not supported for this language.");
      setRunPanelOpen(true);
      return;
    }
    if (!env.apiUrl) {
      setRunError("Backend not configured (VITE_API_URL).");
      setRunOutput("");
      setRunPanelOpen(true);
      return;
    }
    setRunError("");
    setRunOutput("");
    setRunPanelOpen(true);
    setRunLoading(true);
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const res = await fetch(`${env.apiUrl.replace(/\/$/, "")}/api/run`, {
        method: "POST",
        headers,
        body: JSON.stringify({ code: content, language }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRunError(data.error || `HTTP ${res.status}`);
        return;
      }
      const out =
        [data.stdout, data.stderr].filter(Boolean).join("\n") || "(no output)";
      setRunOutput(out);
      if (data.error) setRunError(data.error);
    } catch (err) {
      setRunError(err.message || "Request failed");
    } finally {
      setRunLoading(false);
    }
  }, [env.apiUrl, language, token]);

  useEffect(() => {
    if (accessStatus === "denied") {
      navigate("/", { replace: true });
    }
  }, [accessStatus, navigate]);

  if (accessStatus === "pending") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-surface text-zinc-100">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="text-sm text-zinc-400">
          {!roomCode
            ? "Некорректная ссылка на комнату."
            : "Проверка доступа к комнате…"}
        </p>
      </div>
    );
  }

  if (accessStatus === "denied") {
    return null;
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-surface text-zinc-100">
      <Toolbar
        roomCode={roomCode}
        language={language}
        onLanguageChange={handleLanguageChange}
        userDisplayName={user?.name ?? user?.email ?? "User"}
        onLogout={handleLogout}
        onRun={handleRun}
        runLoading={runLoading}
        isRoomOwner={isRoomOwner}
      />

      <main className="flex min-h-0 flex-1">
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <EditorWorkspace
              ref={workspaceRef}
              roomCode={roomCode}
              language={language}
              username={user?.name ?? user?.email ?? "User"}
              wsUrl={env.wsUrl}
              token={token}
              onStatusChange={handleStatusChange}
              isRoomOwner={isRoomOwner}
              onLanguageChange={setLanguage}
              myColorFromApi={myColorFromApi}
            />
          </div>
          {runPanelOpen && (
            <RunOutputPanel
              output={runOutput}
              error={runError}
              loading={runLoading}
              onClose={() => setRunPanelOpen(false)}
            />
          )}
        </section>
        <ParticipantsPanel
          participants={participants}
          currentUserId={user?.id}
        />
      </main>

      <StatusBar
        connectionStatus={status.connectionStatus}
        isSynced={status.isSynced}
        roomName={roomCode}
      />
    </div>
  );
}
