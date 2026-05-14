package api

import (
	"archive/zip"
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"net/http"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/export"
	"github.com/0xSidBanerjee/tusk/internal/model"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	taskStore db.TaskStore
	listStore db.ListStore
}

func NewHandler(taskStore db.TaskStore, listStore db.ListStore) *Handler {
	return &Handler{taskStore: taskStore, listStore: listStore}
}

type CreateTaskRequest struct {
	ListID      *string         `json:"list_id"`
	Title       string          `json:"title" binding:"required"`
	Description *string         `json:"description"`
	Priority    *model.Priority `json:"priority"`
	Deadline    *time.Time      `json:"deadline"`
}

func (h *Handler) CreateTask(c *gin.Context) {
	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Priority != nil && !req.Priority.IsValid() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid priority"})
		return
	}

	listID := ""
	if req.ListID != nil {
		listID = *req.ListID
	}

	if listID != "" && listID != "default" {
		l, err := h.listStore.GetListByID(listID)
		if err != nil {
			slog.Error("failed to validate list", "id", listID, "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if l == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "list not found"})
			return
		}
	}

	task := &model.Task{
		ListID:      req.ListID,
		Title:       req.Title,
		Description: req.Description,
		Priority:    req.Priority,
		Deadline:    req.Deadline,
		Status:      false,
	}

	if err := h.taskStore.CreateTask(task); err != nil {
		slog.Error("failed to create task", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusCreated, task)
}

func (h *Handler) GetTasks(c *gin.Context) {
	filters := db.GetAllFilters{
		Page:     1,
		PageSize: 10,
	}

	filters.ListID = c.Query("list_id")

	if p := c.Query("priority"); p != "" {
		priority := model.Priority(p)
		if !priority.IsValid() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid priority filter"})
			return
		}
		filters.Priority = &priority
	}

	if s := c.Query("status"); s != "" {
		if s == "true" {
			filters.Status = "completed"
		} else if s == "false" {
			filters.Status = "pending"
		} else {
			filters.Status = s
		}
	}

	if p := c.Query("page"); p != "" {
		page, _ := strconv.Atoi(p)
		if page > 0 {
			filters.Page = page
		}
	}

	if ps := c.Query("page_size"); ps != "" {
		pageSize, _ := strconv.Atoi(ps)
		if pageSize > 0 {
			filters.PageSize = pageSize
		}
	}

	tasks, total, err := h.taskStore.GetAllTasks(filters)
	if err != nil {
		slog.Error("failed to get tasks", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      tasks,
		"total":     total,
		"page":      filters.Page,
		"page_size": filters.PageSize,
	})
}

type UpdateTaskRequest struct {
	ListID      *string         `json:"list_id"`
	Title       *string         `json:"title"`
	Description *string         `json:"description"`
	Priority    *model.Priority `json:"priority"`
	Deadline    *time.Time      `json:"deadline"`
	Status      *bool           `json:"status"`
}

func (h *Handler) UpdateTask(c *gin.Context) {
	id := c.Param("id")
	body, _ := io.ReadAll(c.Request.Body)
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task, err := h.taskStore.GetTaskByID(id)
	if err != nil {
		slog.Error("failed to get task for update", "id", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}

	if req.ListID != nil {
		listID := *req.ListID
		if listID != "" && listID != "default" {
			l, err := h.listStore.GetListByID(listID)
			if err != nil {
				slog.Error("failed to validate list for update", "id", listID, "error", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
				return
			}
			if l == nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "list not found"})
				return
			}
		}
		if listID == "" {
			task.ListID = nil
		} else {
			task.ListID = req.ListID
		}
	}
	if req.Title != nil {
		task.Title = *req.Title
	}
	if req.Description != nil {
		task.Description = req.Description
	}
	if req.Priority != nil {
		if !req.Priority.IsValid() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid priority"})
			return
		}
		task.Priority = req.Priority
	}
	if req.Deadline != nil {
		task.Deadline = req.Deadline
	} else {
		var raw map[string]interface{}
		_ = json.Unmarshal(body, &raw)
		if _, ok := raw["deadline"]; ok {
			task.Deadline = nil
		}
	}
	if req.Status != nil {
		task.Status = *req.Status
	}

	if err := h.taskStore.UpdateTask(task); err != nil {
		slog.Error("failed to update task", "id", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, task)
}

func (h *Handler) DeleteTask(c *gin.Context) {
	id := c.Param("id")
	if err := h.taskStore.DeleteTask(id); err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
			return
		}
		slog.Error("failed to delete task", "id", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.Status(http.StatusNoContent)
}

type CreateListRequest struct {
	Name  string `json:"name" binding:"required"`
	Color string `json:"color" binding:"required"`
}

func (h *Handler) CreateList(c *gin.Context) {
	var req CreateListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !strings.HasPrefix(req.Color, "#") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid color hex string"})
		return
	}

	list := &model.List{
		Name:  req.Name,
		Color: req.Color,
	}

	if err := h.listStore.CreateList(list); err != nil {
		if errors.Is(err, db.ErrDuplicateListName) {
			c.JSON(http.StatusConflict, gin.H{"error": "a list with this name already exists"})
			return
		}
		slog.Error("failed to create list", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusCreated, list)
}

func (h *Handler) GetLists(c *gin.Context) {
	lists, err := h.listStore.GetAllLists()
	if err != nil {
		slog.Error("failed to get lists", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": lists})
}

type UpdateListRequest struct {
	Name  *string `json:"name"`
	Color *string `json:"color"`
}

func (h *Handler) UpdateList(c *gin.Context) {
	id := c.Param("id")
	if id == "default" {
		c.JSON(http.StatusForbidden, gin.H{"error": "default list cannot be updated"})
		return
	}

	var req UpdateListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	list, err := h.listStore.GetListByID(id)
	if err != nil {
		slog.Error("failed to get list for update", "id", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if list == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "list not found"})
		return
	}

	if req.Name != nil {
		if *req.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name cannot be empty"})
			return
		}
		list.Name = *req.Name
	}
	if req.Color != nil {
		if !strings.HasPrefix(*req.Color, "#") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid color hex string"})
			return
		}
		list.Color = *req.Color
	}

	if err := h.listStore.UpdateList(list); err != nil {
		if errors.Is(err, db.ErrDuplicateListName) {
			c.JSON(http.StatusConflict, gin.H{"error": "a list with this name already exists"})
			return
		}
		slog.Error("failed to update list", "id", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, list)
}

func (h *Handler) Export(c *gin.Context) {
	format := c.DefaultQuery("format", "json")
	
	tasks, _, err := h.taskStore.GetAllTasks(db.GetAllFilters{Page: 1, PageSize: 1000000, Status: "all"})
	if err != nil {
		slog.Error("failed to get tasks for export", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	lists, err := h.listStore.GetAllLists()
	if err != nil {
		slog.Error("failed to get lists for export", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	formatter, err := export.GetFormatter(format)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	files, err := formatter.Format(lists, tasks)
	if err != nil {
		slog.Error("failed to format export", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	timestamp := time.Now().Format("20060102150405")
	
	if strings.ToUpper(format) == "CSV" {
		buf := new(bytes.Buffer)
		zw := zip.NewWriter(buf)
		for name, content := range files {
			f, err := zw.Create(name)
			if err != nil {
				slog.Error("failed to create zip entry", "name", name, "error", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
				return
			}
			_, err = f.Write(content)
			if err != nil {
				slog.Error("failed to write zip entry", "name", name, "error", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
				return
			}
		}
		if err := zw.Close(); err != nil {
			slog.Error("failed to close zip writer", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"tusk_export_%s.zip\"", timestamp))
		c.Data(http.StatusOK, "application/zip", buf.Bytes())
	} else {
		var content []byte
		var filename string
		for name, data := range files {
			content = data
			filename = fmt.Sprintf("tusk_export_%s.%s", timestamp, strings.ToLower(format))
			_ = name // silence unused
			break
		}
		
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		c.Data(http.StatusOK, "application/octet-stream", content)
	}
}

func (h *Handler) Import(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
		return
	}

	ext := strings.ToLower(path.Ext(file.Filename))
	format := ""
	switch ext {
	case ".json":
		format = "JSON"
	case ".yaml", ".yml":
		format = "YAML"
	case ".toml":
		format = "TOML"
	case ".csv", ".zip":
		format = "CSV"
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported file format"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open file"})
		return
	}
	defer src.Close()

	data, err := io.ReadAll(src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
		return
	}

	// For CSV, if it's not a ZIP, we need to wrap it or handle it.
	// But according to requirements: "For CSV zip: accept a .zip containing _tasks.csv and _lists.csv"
	// If user uploads a single .csv, we might error out since we need both.
	// Let's rely on Import function to handle it.

	// Use our internal db to get access to *sql.DB
	// SQLiteStore has a private db field, we might need a getter or cast.
	// Actually, let's assume SQLiteStore is implemented as a struct we can access.
	// I'll check store.go again.
	// It is `type SQLiteStore struct { db *sql.DB }`.
	// I'll add a getter for it.

	// For now, I'll use a hack if I can't access it, but I'll add a getter to SQLiteStore.

	// Wait, I can't easily get *sql.DB from the interface.
	// I'll add `GetDB() *sql.DB` to the Store interfaces or just use a type assertion.
	
	database := h.getDB()
	if database == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error: db access failed"})
		return
	}

	result, err := export.Import(database, format, data)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) getDB() *sql.DB {
	// Type assertion to SQLiteStore
	if store, ok := h.taskStore.(*db.SQLiteStore); ok {
		// Use reflection or just add a getter in store.go
		// I'll add a getter.
		return store.GetDB()
	}
	return nil
}

func (h *Handler) DeleteList(c *gin.Context) {
	id := c.Param("id")
	if id == "default" {
		c.JSON(http.StatusForbidden, gin.H{"error": "default list cannot be deleted"})
		return
	}

	if err := h.listStore.DeleteList(id); err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{"error": "list not found"})
			return
		}
		slog.Error("failed to delete list", "id", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.Status(http.StatusNoContent)
}

func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		requestPath := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		slog.Info("request",
			"method", c.Request.Method,
			"path", requestPath,
			"query", query,
			"status", status,
			"latency", latency,
			"ip", c.ClientIP(),
		)
	}
}

func (h *Handler) RegisterRoutes(router *gin.Engine, assets fs.FS) {
	router.Use(LoggerMiddleware())
	router.Use(gin.Recovery())

	v1 := router.Group("/api/v1")
	{
		v1.POST("/tasks", h.CreateTask)
		v1.GET("/tasks", h.GetTasks)
		v1.PUT("/tasks/:id", h.UpdateTask)
		v1.PATCH("/tasks/:id", h.UpdateTask)
		v1.DELETE("/tasks/:id", h.DeleteTask)

		v1.POST("/lists", h.CreateList)
		v1.GET("/lists", h.GetLists)
		v1.PUT("/lists/:id", h.UpdateList)
		v1.PATCH("/lists/:id", h.UpdateList)
		v1.DELETE("/lists/:id", h.DeleteList)

		v1.GET("/export", h.Export)
		v1.POST("/import", h.Import)
	}

	router.NoRoute(func(c *gin.Context) {
		requestPath := c.Request.URL.Path

		// If it's an API route, return 404
		if strings.HasPrefix(requestPath, "/api") {
			c.JSON(http.StatusNotFound, gin.H{"error": "API route not found"})
			return
		}

		trimmedPath := strings.TrimPrefix(requestPath, "/")
		
		// If root, serve index.html directly
		if trimmedPath == "" {
			content, err := fs.ReadFile(assets, "index.html")
			if err == nil {
				c.Data(http.StatusOK, "text/html; charset=utf-8", content)
				return
			}
		}

		// Check if file exists in assets
		_, err := fs.Stat(assets, trimmedPath)
		if err != nil {
			// If the path has an extension, it's likely a missing asset (JS, CSS, Image, etc.)
			// We should return 404 for these, not index.html to avoid confusing the browser
			if path.Ext(trimmedPath) != "" {
				c.JSON(http.StatusNotFound, gin.H{"error": "Asset not found"})
				return
			}
			// Fallback to index.html for SPA routing
			trimmedPath = "index.html"
		}

		// Special case for index.html to avoid redirect loop from c.FileFromFS
		if trimmedPath == "index.html" {
			content, err := fs.ReadFile(assets, "index.html")
			if err == nil {
				c.Data(http.StatusOK, "text/html; charset=utf-8", content)
				return
			}
		}

		c.FileFromFS(trimmedPath, http.FS(assets))
	})
}


