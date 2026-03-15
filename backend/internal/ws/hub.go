// Package ws — WebSocket: хаб комнат и рассылка сообщений.
//
// hub.go — ожидаемые типы/функции:
//
// - type Hub struct { rooms map[string]*Room, ... } — хранит комнаты по roomCode (ключ = short_code).
//
// - (h *Hub) GetOrCreateRoom(roomCode string) *Room — принимает roomCode, возвращает комнату (создаёт при отсутствии).
//
// - (h *Hub) BroadcastToRoom(roomCode string, message []byte) — принимает roomCode и тело сообщения,
//   рассылает сообщение всем подключённым клиентам в этой комнате (для Yjs sync + awareness).
package ws
