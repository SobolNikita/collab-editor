package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/SobolNikita/collab-editor/internal/auth"
	"github.com/SobolNikita/collab-editor/internal/config"
	"github.com/SobolNikita/collab-editor/internal/service"
)

func CreateFile(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.Load()
	if err != nil {
		logError("CreateFile", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	userID, err := auth.UserIDFromRequest(r, &cfg)
	if err != nil {
		logError("CreateFile", err)
		respondJSONError(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	userIDInt, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		logError("CreateFile", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	var body struct {
		Title string `json:"title"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	title := strings.TrimSpace(body.Title)
	if title == "" {
		title = "Untitled"
	}
	file, err := service.CreateFile(r.Context(), userIDInt, title)
	if err != nil {
		logError("CreateFile", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"id": file.ID, "shortCode": file.ShortCode})
}

func JoinRoom(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.Load()
	if err != nil {
		logError("JoinRoom", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	userID, err := auth.UserIDFromRequest(r, &cfg)
	if err != nil {
		logError("JoinRoom", err)
		respondJSONError(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	userIDInt, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		logError("JoinRoom", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	fileIDStr := r.PathValue("id")
	if fileIDStr == "" {
		respondJSONError(w, "missing file id", http.StatusBadRequest)
		return
	}
	fileID, err := strconv.ParseInt(fileIDStr, 10, 64)
	if err != nil {
		respondJSONError(w, "invalid file id", http.StatusBadRequest)
		return
	}
	err = service.JoinRoom(r.Context(), fileID, userIDInt)
	if err != nil {
		if errors.Is(err, service.ErrFileNotFound) {
			respondJSONError(w, "file not found", http.StatusNotFound)
			return
		}
		logError("JoinRoom", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"id": fileID})
}

func JoinByCode(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.Load()
	if err != nil {
		logError("JoinByCode", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	userID, err := auth.UserIDFromRequest(r, &cfg)
	if err != nil {
		logError("JoinByCode", err)
		respondJSONError(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	userIDInt, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		logError("JoinByCode", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	code := r.PathValue("code")
	if code == "" {
		respondJSONError(w, "missing code", http.StatusBadRequest)
		return
	}
	_, err = service.JoinByCode(r.Context(), code, userIDInt)
	if err != nil {
		if errors.Is(err, service.ErrFileNotFound) {
			respondJSONError(w, "file not found", http.StatusNotFound)
			return
		}
		logError("JoinByCode", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"shortCode": code})
}
func GetRoomParticipants(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.Load()
	if err != nil {
		logError("GetRoomParticipants", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	userID, err := auth.UserIDFromRequest(r, &cfg)
	if err != nil {
		logError("GetRoomParticipants", err)
		respondJSONError(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	userIDInt, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		logError("GetRoomParticipants", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	roomCode := r.PathValue("roomCode")
	if roomCode == "" {
		respondJSONError(w, "missing room code", http.StatusBadRequest)
		return
	}
	participants, err := service.GetRoomParticipants(r.Context(), roomCode)
	if err != nil {
		if errors.Is(err, service.ErrFileNotFound) {
			respondJSONError(w, "room not found", http.StatusNotFound)
			return
		}
		logError("GetRoomParticipants", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	allowed := false
	for _, p := range participants {
		if p.UserID == userIDInt {
			allowed = true
			break
		}
	}
	if !allowed {
		respondJSONError(w, "access denied", http.StatusForbidden)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"participants": participants})
}
func GetRoomPermissions(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.Load()
	if err != nil {
		logError("GetRoomPermissions", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	userID, err := auth.UserIDFromRequest(r, &cfg)
	if err != nil {
		logError("GetRoomPermissions", err)
		respondJSONError(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	userIDInt, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		logError("GetRoomPermissions", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	roomCode := r.PathValue("roomId")
	if roomCode == "" {
		respondJSONError(w, "missing room code", http.StatusBadRequest)
		return
	}
	ownerId, err := service.GetOwnerByRoomCode(r.Context(), roomCode)
	if err != nil {
		if errors.Is(err, service.ErrFileNotFound) {
			respondJSONError(w, "room not found", http.StatusNotFound)
			return
		}
		logError("GetRoomPermissions", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	isOwner := ownerId == userIDInt
	respondJSON(w, http.StatusOK, map[string]interface{}{"isOwner": isOwner})
}

func Run(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		Code     string `json:"code"`
		Language string `json:"language"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondJSONError(w, "invalid body", http.StatusBadRequest)
		return
	}
	language := strings.TrimSpace(body.Language)
	code := body.Code
	stdout, stderr, err := service.Run(r.Context(), code, language)
	if err != nil {
		logError("Run", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"stdout": stdout,
		"stderr": stderr,
	})
}

func GetMyRooms(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.Load()
	if err != nil {
		logError("GetMyRooms", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	userID, err := auth.UserIDFromRequest(r, &cfg)
	if err != nil {
		logError("GetMyRooms", err)
		respondJSONError(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	userIDInt, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		logError("GetMyRooms", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	rooms, err := service.GetMyRooms(r.Context(), userIDInt)
	if err != nil {
		logError("GetMyRooms", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"rooms": rooms})
}

func DeleteRoom(w http.ResponseWriter, r *http.Request) {
	cfg, err := config.Load()
	if err != nil {
		logError("DeleteRoom", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	userID, err := auth.UserIDFromRequest(r, &cfg)
	if err != nil {
		logError("DeleteRoom", err)
		respondJSONError(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	userIDInt, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		logError("DeleteRoom", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	roomCode := r.PathValue("roomCode")
	if roomCode == "" {
		respondJSONError(w, "missing room code", http.StatusBadRequest)
		return
	}
	err = service.DeleteRoom(r.Context(), roomCode, userIDInt)
	if err != nil {
		if errors.Is(err, service.ErrFileNotFound) {
			respondJSONError(w, "room not found", http.StatusNotFound)
			return
		}
		if errors.Is(err, service.ErrForbidden) {
			respondJSONError(w, "only the owner can delete the room", http.StatusForbidden)
			return
		}
		logError("DeleteRoom", err)
		respondJSONError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
