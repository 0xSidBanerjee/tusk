package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/model"
	"github.com/gin-gonic/gin"
)

func TestHandlers(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dbFile := "test_api.db"
	defer os.Remove(dbFile)

	database, _ := db.InitDB(dbFile)
	store := db.NewSQLiteStore(database)
	handler := NewHandler(store)
	router := gin.New()
	handler.RegisterRoutes(router, os.DirFS("../../web/dist"))

	// Test Create
	taskReq := CreateTaskRequest{Title: "API Task"}
	body, _ := json.Marshal(taskReq)
	req, _ := http.NewRequest("POST", "/api/v1/tasks", bytes.NewBuffer(body))
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", resp.Code)
	}

	var created model.Task
	json.Unmarshal(resp.Body.Bytes(), &created)

	// Test Get
	req, _ = http.NewRequest("GET", "/api/v1/tasks", nil)
	resp = httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.Code)
	}

	// Test Update
	updateReq := UpdateTaskRequest{Status: ptr(true)}
	body, _ = json.Marshal(updateReq)
	req, _ = http.NewRequest("PUT", "/api/v1/tasks/"+created.ID, bytes.NewBuffer(body))
	resp = httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.Code)
	}

	// Test Delete
	req, _ = http.NewRequest("DELETE", "/api/v1/tasks/"+created.ID, nil)
	resp = httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	if resp.Code != http.StatusNoContent {
		t.Errorf("Expected status 204, got %d", resp.Code)
	}
}

func ptr[T any](v T) *T {
	return &v
}
