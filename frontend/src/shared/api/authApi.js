const STORAGE_KEY = "collab_editor_auth";

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.token) return null;
    return data;
  } catch {
    return null;
  }
}

export function setStoredAuth(data) {
  try {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    console.error("Failed to set stored auth");
  }
}

export async function login(apiUrl, { email, password }) {
  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function register(apiUrl, { email, password, name }) {
  const res = await fetch(`${apiUrl.replace(/\/$/, "")}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: name || email.split("@")[0] }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data;
}

export function getGoogleAuthUrl(apiUrl, callbackUrl = "", redirectPath = "") {
  const base = apiUrl.replace(/\/$/, "");
  const params = new URLSearchParams();
  if (callbackUrl) params.set("callback_url", callbackUrl);
  if (redirectPath) params.set("redirect", redirectPath);
  const q = params.toString();
  return `${base}/api/auth/google${q ? `?${q}` : ""}`;
}
