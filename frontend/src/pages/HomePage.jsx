import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../app/authContext.js";
import { getEnv } from "../app/env.js";
import { getMyRooms, deleteRoom } from "../shared/api/roomApi.js";

const ROOMS_PER_PAGE = 8;

export function HomePage() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const env = useMemo(() => getEnv(), []);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("Новый документ");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [deletingCode, setDeletingCode] = useState(null);
  const [roomsPage, setRoomsPage] = useState(1);

  const loadRooms = useCallback(async () => {
    if (!env.apiUrl || !token) {
      setRooms([]);
      setRoomsLoading(false);
      return;
    }
    setRoomsLoading(true);
    setRoomsError("");
    const { rooms: list, ok, error } = await getMyRooms(token);
    setRooms(list ?? []);
    if (!ok) setRoomsError(error || "Не удалось загрузить список комнат");
    setRoomsLoading(false);
    setRoomsPage(1);
  }, [env.apiUrl, token]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const totalPages = Math.max(1, Math.ceil(rooms.length / ROOMS_PER_PAGE));
  const paginatedRooms = useMemo(() => {
    const start = (roomsPage - 1) * ROOMS_PER_PAGE;
    return rooms.slice(start, start + ROOMS_PER_PAGE);
  }, [rooms, roomsPage]);

  const handleCreateRoom = async (title) => {
    const finalTitle =
      (typeof title === "string" ? title : createTitle).trim() ||
      "Новый документ";
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
        body: JSON.stringify({ title: finalTitle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error || `Ошибка ${res.status}`);
        return;
      }
      const shortCode = data.shortCode ?? data.short_code;
      if (!shortCode) {
        setCreateError("Сервер не вернул код комнаты.");
        return;
      }
      setShowCreateModal(false);
      setCreateTitle("Новый документ");
      navigate(`/editor/${encodeURIComponent(shortCode)}`);
    } catch (err) {
      setCreateError(err.message || "Не удалось создать комнату.");
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreateModal = () => {
    setCreateError("");
    setCreateTitle("Новый документ");
    setShowCreateModal(true);
  };

  const submitCreateModal = (e) => {
    e.preventDefault();
    handleCreateRoom(createTitle);
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
        setJoinError(
          res.status === 404
            ? "Файл не найден."
            : data.error || "Нет доступа или ошибка сервера.",
        );
        return;
      }
      const shortCode = data.shortCode ?? data.short_code ?? code;
      navigate(`/editor/${encodeURIComponent(shortCode)}`);
    } catch (err) {
      setJoinError(err.message || "Не удалось присоединиться.");
    }
  };

  const handleDeleteRoom = async (shortCode, title) => {
    if (
      !window.confirm(
        `Удалить комнату «${title || shortCode}»? Это действие нельзя отменить.`,
      )
    )
      return;
    setDeletingCode(shortCode);
    const { ok, error } = await deleteRoom(shortCode);
    setDeletingCode(null);
    if (ok) {
      setRooms((prev) =>
        prev.filter((r) => (r.shortCode ?? r.short_code) !== shortCode),
      );
    } else {
      setRoomsError(error || "Не удалось удалить комнату");
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface-elevated/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
            Collab Editor
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">
              {user?.name ?? user?.email}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-xl border border-border bg-panel px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-panel-hover hover:text-zinc-100">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <section className="mb-10 rounded-3xl border border-border bg-panel p-6 shadow-card">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Действия
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              {createError && (
                <p className="mb-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                  {createError}
                </p>
              )}
              <button
                type="button"
                onClick={openCreateModal}
                disabled={createLoading}
                className="w-full rounded-xl bg-accent py-3.5 text-sm font-semibold text-white shadow-glow transition hover:bg-accent-hover disabled:opacity-50">
                Создать комнату
              </button>
            </div>
            <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">
              {joinError && (
                <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                  {joinError}
                </p>
              )}
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="Код комнаты (6 символов)"
                maxLength={6}
                className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="submit"
                className="w-full rounded-xl border border-border bg-panel-hover py-3.5 text-sm font-medium text-zinc-200 transition hover:bg-panel hover:text-white">
                Присоединиться по коду
              </button>
            </form>
          </div>
        </section>

        {showCreateModal && (
          <div
            className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={(e) =>
              e.target === e.currentTarget && setShowCreateModal(false)
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-modal-title">
            <div
              className="w-full max-w-md rounded-3xl border border-border bg-panel p-6 shadow-card-hover"
              onClick={(e) => e.stopPropagation()}>
              <h2
                id="create-modal-title"
                className="mb-4 text-lg font-semibold text-zinc-100">
                Название документа
              </h2>
              <form
                onSubmit={submitCreateModal}
                className="flex flex-col gap-4">
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="Новый документ"
                  autoFocus
                  className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-xl border border-border bg-panel-hover py-3 text-sm font-medium text-zinc-300 transition hover:bg-panel hover:text-white">
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-accent-hover disabled:opacity-50">
                    {createLoading ? "Создание…" : "Создать"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="rounded-3xl border border-border bg-panel p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Мои комнаты
              {rooms.length > 0 && (
                <span className="ml-2 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                  {rooms.length}
                </span>
              )}
            </h2>
          </div>

          {roomsError && (
            <p className="mb-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              {roomsError}
            </p>
          )}

          {roomsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-accent" />
              <p className="mt-3 text-sm text-zinc-500">Загрузка комнат…</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 rounded-2xl bg-surface-elevated p-5">
                <svg
                  className="mx-auto h-9 w-9 text-zinc-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p className="text-zinc-400">Нет комнат</p>
              <p className="mt-1 text-sm text-zinc-500">
                Создайте комнату или присоединитесь по коду выше
              </p>
            </div>
          ) : (
            <>
              <ul className="grid gap-3 sm:grid-cols-2">
                {paginatedRooms.map((room) => {
                  const code = room.shortCode ?? room.short_code;
                  const title = room.title ?? "Без названия";
                  const isOwner = Boolean(room.isOwner);
                  return (
                    <li
                      key={code}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-zinc-600 hover:shadow-card">
                      <Link
                        to={`/editor/${encodeURIComponent(code)}`}
                        className="flex min-h-0 flex-1 flex-col p-4">
                        <p className="truncate font-medium text-zinc-100 group-hover:text-white">
                          {title}
                        </p>
                        <span className="mt-1.5 inline-block w-fit rounded-lg bg-panel px-2.5 py-1 font-mono text-xs text-zinc-500">
                          {code}
                        </span>
                      </Link>
                      <div className="flex items-center gap-2 border-t border-border-subtle px-4 py-3">
                        <Link
                          to={`/editor/${encodeURIComponent(code)}`}
                          className="rounded-xl bg-accent/90 px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent">
                          Открыть
                        </Link>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteRoom(code, title);
                            }}
                            disabled={deletingCode === code}
                            className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/25 disabled:opacity-50">
                            {deletingCode === code ? "…" : "Удалить"}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRoomsPage((p) => Math.max(1, p - 1))}
                    disabled={roomsPage === 1}
                    className="rounded-xl border border-border bg-panel px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-panel-hover disabled:opacity-40 disabled:hover:bg-panel">
                    ← Назад
                  </button>
                  <span className="flex items-center gap-1.5 px-2">
                    {(() => {
                      const maxVisible = 5;
                      let pages = [];
                      if (totalPages <= maxVisible + 2) {
                        pages = Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        );
                      } else {
                        const left = Math.max(
                          1,
                          roomsPage - Math.floor(maxVisible / 2),
                        );
                        const right = Math.min(
                          totalPages,
                          left + maxVisible - 1,
                        );
                        if (left > 1) pages.push(1, "…");
                        pages.push(
                          ...Array.from(
                            { length: right - left + 1 },
                            (_, i) => left + i,
                          ),
                        );
                        if (right < totalPages) pages.push("…", totalPages);
                      }
                      return pages.map((p, idx) =>
                        p === "…" ? (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-1 text-zinc-500">
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setRoomsPage(p)}
                            className={`min-w-[2.5rem] rounded-xl py-2 text-sm font-medium transition ${
                              roomsPage === p
                                ? "bg-accent text-white shadow-glow"
                                : "border border-border bg-surface-elevated text-zinc-300 hover:bg-panel-hover"
                            }`}>
                            {p}
                          </button>
                        ),
                      );
                    })()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setRoomsPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={roomsPage === totalPages}
                    className="rounded-xl border border-border bg-panel px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-panel-hover disabled:opacity-40 disabled:hover:bg-panel">
                    Вперёд →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
