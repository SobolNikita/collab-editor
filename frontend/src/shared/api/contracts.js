export const wsContracts = {
  roomFormat: "room:file:<fileId>",
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

export function getRoomName(fileId) {
  return `room:file:${fileId}`;
}
