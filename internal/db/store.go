package db

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/0xSidBanerjee/tusk/internal/model"
	"github.com/google/uuid"
)

type GetAllFilters struct {
	Priority *model.Priority
	Status   *bool
	Page     int
	PageSize int
}

type TaskStore interface {
	Create(task *model.Task) error
	GetAll(filters GetAllFilters) ([]model.Task, int, error)
	GetByID(id string) (*model.Task, error)
	Update(task *model.Task) error
	Delete(id string) error
}

type SQLiteStore struct {
	db *sql.DB
}

func NewSQLiteStore(db *sql.DB) *SQLiteStore {
	return &SQLiteStore{db: db}
}

func (s *SQLiteStore) Create(task *model.Task) error {
	if task.ID == "" {
		task.ID = uuid.New().String()
	}
	now := time.Now()
	task.CreatedAt = now
	task.UpdatedAt = now

	query := `INSERT INTO tasks (id, title, description, priority, deadline, status, created_at, updated_at) 
	          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := s.db.Exec(query, task.ID, task.Title, task.Description, task.Priority, task.Deadline, task.Status, task.CreatedAt, task.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create task: %w", err)
	}
	return nil
}

func (s *SQLiteStore) GetAll(filters GetAllFilters) ([]model.Task, int, error) {
	var whereClauses []string
	var args []interface{}

	if filters.Priority != nil {
		whereClauses = append(whereClauses, "priority = ?")
		args = append(args, *filters.Priority)
	}

	if filters.Status != nil {
		whereClauses = append(whereClauses, "status = ?")
		args = append(args, *filters.Status)
	}

	where := ""
	if len(whereClauses) > 0 {
		where = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tasks %s", where)
	var total int
	err := s.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count tasks: %w", err)
	}

	// Fetch data
	if filters.Page <= 0 {
		filters.Page = 1
	}
	if filters.PageSize <= 0 {
		filters.PageSize = 10
	}
	offset := (filters.Page - 1) * filters.PageSize

	dataQuery := fmt.Sprintf("SELECT id, title, description, priority, deadline, status, created_at, updated_at FROM tasks %s ORDER BY created_at DESC LIMIT ? OFFSET ?", where)
	dataArgs := append(args, filters.PageSize, offset)

	rows, err := s.db.Query(dataQuery, dataArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch tasks: %w", err)
	}
	defer rows.Close()

	var tasks []model.Task
	for rows.Next() {
		var t model.Task
		err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Priority, &t.Deadline, &t.Status, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan task: %w", err)
		}
		tasks = append(tasks, t)
	}

	return tasks, total, nil
}

func (s *SQLiteStore) GetByID(id string) (*model.Task, error) {
	query := "SELECT id, title, description, priority, deadline, status, created_at, updated_at FROM tasks WHERE id = ?"
	var t model.Task
	err := s.db.QueryRow(query, id).Scan(&t.ID, &t.Title, &t.Description, &t.Priority, &t.Deadline, &t.Status, &t.CreatedAt, &t.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get task: %w", err)
	}
	return &t, nil
}

func (s *SQLiteStore) Update(task *model.Task) error {
	task.UpdatedAt = time.Now()
	query := `UPDATE tasks SET title = ?, description = ?, priority = ?, deadline = ?, status = ?, updated_at = ? WHERE id = ?`
	res, err := s.db.Exec(query, task.Title, task.Description, task.Priority, task.Deadline, task.Status, task.UpdatedAt, task.ID)
	if err != nil {
		return fmt.Errorf("failed to update task: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("task not found")
	}
	return nil
}

func (s *SQLiteStore) Delete(id string) error {
	query := "DELETE FROM tasks WHERE id = ?"
	res, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete task: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("task not found")
	}
	return nil
}
