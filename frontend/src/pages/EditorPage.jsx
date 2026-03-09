import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../app/authContext.js";
import { Toolbar } from "../components/editor/Toolbar.jsx";
import { ParticipantsPanel } from "../components/editor/ParticipantsPanel.jsx";
import { RunOutputPanel } from "../components/editor/RunOutputPanel.jsx";
import { StatusBar } from "../components/editor/StatusBar.jsx";
import { EditorWorkspace } from "../features/editor/EditorWorkspace.jsx";
import { getEnv } from "../app/env.js";
import { getRoomParticipants } from "../shared/api/roomApi.js";

const RUNNABLE_LANGUAGES = new Set([
  "javascript",
  "typescript",
  "python",
  "go",
  "cpp",
]);

export function EditorPage() {
  const { fileId = "0" } = useParams();
  const navigate = useNavigate();
  const { user, token, logout: authLogout } = useAuth();
  const [language, setLanguage] = useState("javascript");
  const [status, setStatus] = useState({
    roomName: `room:file:${fileId}`,
    connectionStatus: "connecting",
    isSynced: false,
  });
  const [runOutput, setRunOutput] = useState("");
  const [runError, setRunError] = useState("");
  const [runLoading, setRunLoading] = useState(false);
  const [runPanelOpen, setRunPanelOpen] = useState(false);
  const [participants, setParticipants] = useState([]);

  const workspaceRef = useRef(null);
  const env = useMemo(() => getEnv(), []);

  const roomCode = status.roomName;

  useEffect(() => {
    if (!roomCode || !env.apiUrl || !token) {
      setParticipants([]);
      return;
    }
    let cancelled = false;
    getRoomParticipants(roomCode)
      .then((data) => {
        if (cancelled) return;
        setParticipants(data.participants ?? data ?? []);
      })
      .catch(() => {
        if (!cancelled) setParticipants([]);
      });
    return () => {
      cancelled = true;
    };
  }, [roomCode, env.apiUrl, token]);

  useEffect(() => {
    if (!roomCode || !env.apiUrl || !token) return;
    const id = setInterval(() => {
      getRoomParticipants(roomCode)
        .then((data) => setParticipants(data.participants ?? data ?? []))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [roomCode, env.apiUrl, token]);

  const handleStatusChange = useCallback((nextStatus) => {
    setStatus(nextStatus);
  }, []);

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

  return (
    <div className="flex h-screen w-screen flex-col bg-surface text-slate-100">
      <Toolbar
        fileId={fileId}
        language={language}
        onLanguageChange={setLanguage}
        userDisplayName={user?.name ?? user?.email ?? "User"}
        onLogout={handleLogout}
        onRun={handleRun}
        runLoading={runLoading}
      />

      <main className="flex min-h-0 flex-1">
        <section className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <EditorWorkspace
              ref={workspaceRef}
              fileId={fileId}
              language={language}
              username={user?.name ?? user?.email ?? "User"}
              wsUrl={env.wsUrl}
              token={token}
              onStatusChange={handleStatusChange}
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
        roomName={status.roomName}
      />
    </div>
  );
}
