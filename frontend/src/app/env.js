const requiredVars = ["VITE_WS_URL"];

export function getEnv() {
  const env = {
    wsUrl: import.meta.env.VITE_WS_URL,
    apiUrl: import.meta.env.VITE_API_URL ?? "",
  };

  const missing = requiredVars.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }

  return env;
}
