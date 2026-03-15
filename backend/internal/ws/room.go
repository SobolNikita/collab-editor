// Package ws — WebSocket (продолжение).
//
// room.go — ожидаемые типы/функции:
//
// - type Room struct { code string, clients map[*Client]bool, broadcast chan []byte, ... } — комната с набором клиентов и каналом для рассылки.
//
// - (r *Room) Run() — горутина: читает из broadcast и шлёт каждое сообщение всем clients.
//
// - (r *Room) Register(client *Client), (r *Room) Unregister(client *Client) — добавить/удалить клиента при подключении/отключении.
//
// - type Client struct { conn *websocket.Conn, room *Room, send chan []byte } — одно WebSocket-соединение; читает из conn и пишет в room.broadcast; пишет из send в conn.
package ws
