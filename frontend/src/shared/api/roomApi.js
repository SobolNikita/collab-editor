import { getEnv } from "../../app/env.js";
import { getStoredAuth } from "./authApi.js";

export async function getRoomParticipants(roomCode) {
  const env = getEnv();
  const auth = getStoredAuth();
  if (!env.apiUrl || !auth?.token) return { participants: [], ok: false };
  const base = env.apiUrl.replace(/\/$/, "");

  const url = `${base}/api/rooms/${encodeURIComponent(roomCode)}/participants`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { participants: [], ok: false };
    const list = data.participants ?? data ?? [];
    return { participants: Array.isArray(list) ? list : [], ok: true };
  } catch (err) {
    console.error("Error getting room participants:", err);
    return { participants: [], ok: false };
  }
}

export async function checkRoomAccess(roomCode, currentUserId) {
  const env = getEnv();
  const auth = getStoredAuth();
  if (!env.apiUrl || !auth?.token) return false;

  const base = env.apiUrl.replace(/\/$/, "");
  const url = `${base}/api/rooms/${encodeURIComponent(roomCode)}/participants`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
    });
    if (res.status === 403) return false;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return false;
    const list = data.participants ?? data ?? [];
    const participants = Array.isArray(list) ? list : [];
    const id = currentUserId ?? auth?.user?.id;
    if (id == null) return false;
    return participants.some(
      (p) => String(p.id) === String(id) || String(p.user_id) === String(id),
    );
  } catch {
    return false;
  }
}

export async function isOwner(roomId) {
  const env = getEnv();
  const auth = getStoredAuth();
  if (!env.apiUrl || !auth?.token) return false;

  const base = env.apiUrl.replace(/\/$/, "");
  const url = `${base}/api/rooms/${encodeURIComponent(roomId)}/permissions`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return false;
    return Boolean(data.isOwner);
  } catch (err) {
    console.error("Error checking permissions:", err);
    return false;
  }
}

export async function getMyRooms(token) {
  const env = getEnv();
  const authToken = token ?? getStoredAuth()?.token;
  if (!env.apiUrl || !authToken) return { rooms: [], ok: false };

  const base = env.apiUrl.replace(/\/$/, "");
  const url = `${base}/api/rooms`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.error || data.message || `Ошибка ${res.status}`;
      return { rooms: [], ok: false, error: msg };
    }
    const list = data.rooms ?? data ?? [];
    return { rooms: Array.isArray(list) ? list : [], ok: true };
  } catch (err) {
    console.error("Error getting my rooms:", err);
    return { rooms: [], ok: false, error: err.message };
  }
}

export async function deleteRoom(shortCode) {
  const env = getEnv();
  const auth = getStoredAuth();
  if (!env.apiUrl || !auth?.token)
    return { ok: false, error: "Нет авторизации" };

  const base = env.apiUrl.replace(/\/$/, "");
  const url = `${base}/api/rooms/${encodeURIComponent(shortCode)}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return {
      ok: false,
      error:
        data.error ||
        (res.status === 403
          ? "Только владелец может удалить комнату"
          : `Ошибка ${res.status}`),
    };
  } catch (err) {
    return { ok: false, error: err.message || "Не удалось удалить комнату" };
  }
}

export async function saveDoc(roomName, update) {
  const env = getEnv();
  const auth = getStoredAuth();
  if (!env.apiUrl || !auth?.token)
    return { ok: false, error: "Нет авторизации" };

  const base = env.apiUrl.replace(/\/$/, "");
  const url = `${base}/api/rooms/${encodeURIComponent(roomName)}/doc`;

  const payload =
    update instanceof Uint8Array ? { update: Array.from(update) } : { update };

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || `Ошибка ${res.status}` };
  } catch (err) {
    console.error("Error saving document:", err);
    return { ok: false, error: err.message || "Не удалось сохранить документ" };
  }
}

export async function loadDocument(roomName) {
  const env = getEnv();
  const auth = getStoredAuth();
  if (!env.apiUrl || !auth?.token)
    return { ok: false, error: "Нет авторизации" };

  const base = env.apiUrl.replace(/\/$/, "");
  const url = `${base}/api/rooms/${encodeURIComponent(roomName)}/doc`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      return { ok: false, error: data.error || `Ошибка ${res.status}` };
    const update = Array.isArray(data.update)
      ? new Uint8Array(data.update)
      : null;
    return { ok: true, update, yjsState: update };
  } catch (err) {
    console.error("Error getting document:", err);
    return { ok: false, error: err.message || "Не удалось получить документ" };
  }
}
