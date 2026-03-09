import { getEnv } from "../../app/env.js";
import { getStoredAuth } from "./authApi.js";

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
