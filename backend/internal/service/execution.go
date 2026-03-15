package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/SobolNikita/collab-editor/internal/config"
)

type JudgeResponse struct {
	Stdout        *string `json:"stdout"`
	Stderr        *string `json:"stderr"`
	CompileOutput *string `json:"compile_output"`
	Message       *string `json:"message"`
	Status        struct {
		Description string `json:"description"`
	} `json:"status"`
}

var languageID = map[string]int{
	"javascript": 63,
	"typescript": 74,
	"python":     71,
	"java":       62,
	"cpp":        54,
	"c":          50,
	"go":         60,
}

func Run(ctx context.Context, code, language string) (string, string, error) {
	cfg, err := config.Load()
	if err != nil {
		return "", "", fmt.Errorf("ошибка загрузки конфига: %w", err)
	}

	judge0URL := cfg.Judge0URL
	xAuthToken := cfg.XAuthToken

	langID := languageID[language]
	if langID == 0 {
		return "", "", fmt.Errorf("неверный язык: %s", language)
	}

	payload := map[string]interface{}{
		"language_id": langID,
		"source_code": code,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", "", fmt.Errorf("ошибка кодирования JSON: %w", err)
	}

	reqURL := fmt.Sprintf("%s/submissions?base64_encoded=false&wait=true", judge0URL)

	req, err := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", "", fmt.Errorf("ошибка создания HTTP-запроса: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if xAuthToken != "" {
		req.Header.Set("X-Auth-Token", xAuthToken)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("ошибка при выполнении HTTP-запроса: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", "", fmt.Errorf("сервер вернул статус: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("ошибка чтения ответа: %w", err)
	}

	var judgeResp JudgeResponse
	if err := json.Unmarshal(body, &judgeResp); err != nil {
		return "", "", fmt.Errorf("ошибка парсинга JSON: %w", err)
	}

	var finalStdout, finalStderr string

	if judgeResp.Stdout != nil {
		finalStdout = *judgeResp.Stdout
	}

	if judgeResp.Stderr != nil {
		finalStderr += *judgeResp.Stderr
	}
	if judgeResp.CompileOutput != nil {
		finalStderr += *judgeResp.CompileOutput
	}
	if judgeResp.Message != nil {
		finalStderr += *judgeResp.Message
	}

	return finalStdout, finalStderr, nil
}
