package service

import (
	"context"
	"errors"
	"strconv"

	"github.com/SobolNikita/collab-editor/internal/auth"
	"github.com/SobolNikita/collab-editor/internal/config"
	"github.com/SobolNikita/collab-editor/internal/models"
	"github.com/SobolNikita/collab-editor/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid email or password")

func Login(ctx context.Context, email, password string, cfg *config.Config) (*models.User, string, error) {
	user, err := repository.GetByEmail(ctx, email)
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}
	token, err := auth.GenerateToken(strconv.FormatInt(user.ID, 10), cfg)
	if err != nil {
		return nil, "", err
	}
	return user, token, nil
}

func Register(ctx context.Context, email, password, name string, cfg *config.Config) (*models.User, string, error) {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}
	user := &models.User{
		Email:        email,
		Name:         name,
		PasswordHash: string(passwordHash),
		GoogleID:     "",
		Avatar:       "",
	}
	err = repository.Create(ctx, user)
	if err != nil {
		return nil, "", err
	}

	token, err := auth.GenerateToken(strconv.FormatInt(user.ID, 10), cfg)
	if err != nil {
		return nil, "", err
	}
	return user, token, nil
}
