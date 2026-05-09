package api

import (
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/model"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	store db.TaskStore
}

func NewHandler(store db.TaskStore) *Handler {
	return &Handler{store: store}
}

type CreateTaskRequest struct {
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

	task := &model.Task{
		Title:       req.Title,
		Description: req.Description,
		Priority:    req.Priority,
		Deadline:    req.Deadline,
		Status:      false,
	}

	if err := h.store.Create(task); err != nil {
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

	tasks, total, err := h.store.GetAll(filters)
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

	task, err := h.store.GetByID(id)
	if err != nil {
		slog.Error("failed to get task for update", "id", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
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

	if err := h.store.Update(task); err != nil {
		slog.Error("failed to update task", "id", id, "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, task)
}

func (h *Handler) DeleteTask(c *gin.Context) {
	id := c.Param("id")
	if err := h.store.Delete(id); err != nil {
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

func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		slog.Info("request",
			"method", c.Request.Method,
			"path", path,
			"query", query,
			"status", status,
			"latency", latency,
			"ip", c.ClientIP(),
		)
	}
}

func (h *Handler) RegisterRoutes(router *gin.Engine) {
	router.Use(LoggerMiddleware())
	router.Use(gin.Recovery())

	v1 := router.Group("/api/v1")
	{
		v1.POST("/tasks", h.CreateTask)
		v1.GET("/tasks", h.GetTasks)
		v1.PUT("/tasks/:id", h.UpdateTask)
		v1.PATCH("/tasks/:id", h.UpdateTask)
		v1.DELETE("/tasks/:id", h.DeleteTask)
	}
}
