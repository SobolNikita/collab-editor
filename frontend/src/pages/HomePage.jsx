import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/authContext.js";
import { getEnv } from "../app/env.js";

export function HomePage() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const env = useMemo(() => getEnv(), []);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleCreateRoom = async () => {
    setCreateError("");
    if (!env.apiUrl || !token) {
      setCreateError("Бэкенд не настроен или нет авторизации.");
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch(`${env.apiUrl.replace(/\/$/, "")}/api/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Новый документ" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error || `Ошибка ${res.status}`);
        return;
      }
      const id = data.id ?? data.file_id;
      if (!id) {
        setCreateError("Сервер не вернул ID комнаты.");
        return;
      }
      navigate(`/editor/${encodeURIComponent(String(id))}`);
    } catch (err) {
      setCreateError(err.message || "Не удалось создать комнату.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setJoinError("");
    const code = roomCodeInput.trim();
    if (!code) return;
    if (!env.apiUrl || !token) {
      setJoinError("Бэкенд не настроен или нет авторизации.");
      return;
    }
    try {
      const res = await fetch(
        `${env.apiUrl.replace(/\/$/, "")}/api/files/by-code/${encodeURIComponent(code)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setJoinError(res.status === 404 ? "Файл не найден." : data.error || "Нет доступа или ошибка сервера.");
        return;
      }
      const id = data.id ?? data.file_id;
      if (!id) {
        setJoinError("Сервер не вернул ID файла.");
        return;
      }
      navigate(`/editor/${encodeURIComponent(String(id))}`);
    } catch (err) {
      setJoinError(err.message || "Не удалось присоединиться.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="mb-6 flex w-full max-w-sm items-center justify-between">
        <span className="text-sm text-slate-400">{user?.name ?? user?.email}</span>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="text-sm text-slate-400 underline hover:text-slate-200"
        >
          Выйти
        </button>
      </div>
      <div className="w-full max-w-sm rounded-lg border border-border bg-panel p-6 shadow-lg">
        <h1 className="mb-6 text-center text-lg font-semibold text-slate-100">
          Collab Editor
        </h1>
        <div className="space-y-4">
          {createError && (
            <p className="rounded bg-red-900/50 px-3 py-2 text-sm text-red-300">
              {createError}
            </p>
          )}
          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={createLoading}
            className="w-full rounded bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {createLoading ? "Создание…" : "Создать комнату"}
          </button>
          <form onSubmit={handleJoinRoom} className="flex flex-col gap-2">
            {joinError && (
              <p className="rounded bg-red-900/50 px-3 py-2 text-sm text-red-300">
                {joinError}
              </p>
            )}
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              placeholder="Код подключения (6 символов)"
              maxLength={6}
              className="rounded border border-border bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
            />
            <button
              type="submit"
              className="w-full rounded border border-border bg-slate-700 py-3 text-sm font-medium text-slate-200 hover:bg-slate-600"
            >
              Присоединиться по коду
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
