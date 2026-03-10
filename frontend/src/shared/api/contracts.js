export const wsContracts = {
  roomFormat: "room by shortCode",
  auth: {
    headers: ["Authorization: Bearer <token>"],
    query: ["token=<jwt> (fallback)"],
  },
  presencePayload: {
    userId: "string",
    name: "string",
    color: "hex-color",
    isTyping: "boolean",
  },
};

export function getRoomName(shortCode) {
  return shortCode ?? "";
}
