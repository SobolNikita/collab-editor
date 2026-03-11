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
