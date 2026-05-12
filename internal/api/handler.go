package api

import (
	"io/fs"
	"log/slog"
	"mime"
	"net/http"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/0xSidBanerjee/tusk/internal/db"
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
		status, err := strconv.ParseBool(s)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status filter"})
			return
		}
		filters.Status = &status
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
		slog.Error("failed to update list", "id", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, list)
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
	}

	router.NoRoute(func(c *gin.Context) {
		requestPath := c.Request.URL.Path

		// If it's an API route, don't serve static files
		if strings.HasPrefix(requestPath, "/api") {
			c.JSON(http.StatusNotFound, gin.H{"error": "API route not found"})
			return
		}

		trimmedPath := strings.TrimPrefix(requestPath, "/")
		if trimmedPath == "" {
			trimmedPath = "index.html"
		}

		// Try to serve the file
		content, err := fs.ReadFile(assets, trimmedPath)
		if err != nil {
			// Fallback to index.html for SPA routing
			content, err = fs.ReadFile(assets, "index.html")
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
				return
			}
			trimmedPath = "index.html"
		}

		// Determine content type
		ext := path.Ext(trimmedPath)
		contentType := mime.TypeByExtension(ext)
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		c.Data(http.StatusOK, contentType, content)
	})
}


