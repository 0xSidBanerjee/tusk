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
	ListID   string
	Priority *model.Priority
	Status   *bool
	Page     int
	PageSize int
}

type TaskStore interface {
	CreateTask(task *model.Task) error
	GetAllTasks(filters GetAllFilters) ([]model.Task, int, error)
	GetTaskByID(id string) (*model.Task, error)
	UpdateTask(task *model.Task) error
	DeleteTask(id string) error
}

type ListStore interface {
	CreateList(list *model.List) error
	GetAllLists() ([]model.List, error)
	GetListByID(id string) (*model.List, error)
	UpdateList(list *model.List) error
	DeleteList(id string) error
}


type SQLiteStore struct {
	db *sql.DB
}

func NewSQLiteStore(db *sql.DB) *SQLiteStore {
	return &SQLiteStore{db: db}
}

func (s *SQLiteStore) CreateTask(task *model.Task) error {
	if task.ID == "" {
		task.ID = uuid.New().String()
	}
	if task.ListID != nil && *task.ListID == "" {
		task.ListID = nil
	}
	now := time.Now()
	task.CreatedAt = now
	task.UpdatedAt = now

	query := `INSERT INTO tasks (id, list_id, title, description, priority, deadline, status, created_at, updated_at) 
	          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := s.db.Exec(query, task.ID, task.ListID, task.Title, task.Description, task.Priority, task.Deadline, task.Status, task.CreatedAt, task.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create task: %w", err)
	}
	return nil
}

func (s *SQLiteStore) GetAllTasks(filters GetAllFilters) ([]model.Task, int, error) {
	var whereClauses []string
	var args []interface{}

	if filters.ListID != "" {
		if filters.ListID == "default" {
			whereClauses = append(whereClauses, "(list_id = ? OR list_id IS NULL)")
		} else {
			whereClauses = append(whereClauses, "list_id = ?")
		}
		args = append(args, filters.ListID)
	}

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

	dataQuery := fmt.Sprintf(`
		SELECT id, list_id, title, description, priority, deadline, status, created_at, updated_at 
		FROM tasks %s 
		ORDER BY 
			CASE WHEN status = 0 AND deadline < datetime('now') THEN 0 ELSE 1 END ASC,
			status ASC, 
			deadline IS NULL ASC,
			deadline ASC,
			CASE priority 
				WHEN 'High' THEN 1 
				WHEN 'Medium' THEN 2 
				WHEN 'Low' THEN 3 
				ELSE 4 
			END ASC, 
			created_at DESC
		LIMIT ? OFFSET ?`, where)
	dataArgs := append(args, filters.PageSize, offset)

	rows, err := s.db.Query(dataQuery, dataArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch tasks: %w", err)
	}
	defer rows.Close()

	var tasks []model.Task
	for rows.Next() {
		var t model.Task
		err := rows.Scan(&t.ID, &t.ListID, &t.Title, &t.Description, &t.Priority, &t.Deadline, &t.Status, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan task: %w", err)
		}
		tasks = append(tasks, t)
	}

	return tasks, total, nil
}

func (s *SQLiteStore) GetTaskByID(id string) (*model.Task, error) {
	query := "SELECT id, list_id, title, description, priority, deadline, status, created_at, updated_at FROM tasks WHERE id = ?"
	var t model.Task
	err := s.db.QueryRow(query, id).Scan(&t.ID, &t.ListID, &t.Title, &t.Description, &t.Priority, &t.Deadline, &t.Status, &t.CreatedAt, &t.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get task: %w", err)
	}
	return &t, nil
}

func (s *SQLiteStore) UpdateTask(task *model.Task) error {
	task.UpdatedAt = time.Now()
	query := `UPDATE tasks SET list_id = ?, title = ?, description = ?, priority = ?, deadline = ?, status = ?, updated_at = ? WHERE id = ?`
	res, err := s.db.Exec(query, task.ListID, task.Title, task.Description, task.Priority, task.Deadline, task.Status, task.UpdatedAt, task.ID)
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

func (s *SQLiteStore) DeleteTask(id string) error {
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

func (s *SQLiteStore) CreateList(list *model.List) error {
	if list.ID == "" {
		list.ID = uuid.New().String()
	}
	list.CreatedAt = time.Now()
	query := `INSERT INTO lists (id, name, color, created_at) VALUES (?, ?, ?, ?)`
	_, err := s.db.Exec(query, list.ID, list.Name, list.Color, list.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create list: %w", err)
	}
	return nil
}

func (s *SQLiteStore) GetAllLists() ([]model.List, error) {
	query := `
		SELECT 
			l.id, l.name, l.color, l.created_at, 
			COUNT(t.id) as total_count,
			COALESCE(SUM(CASE WHEN t.status = 0 THEN 1 ELSE 0 END), 0) as incomplete_count
		FROM lists l
		LEFT JOIN tasks t ON (l.id = t.list_id OR (l.id = 'default' AND t.list_id IS NULL))
		GROUP BY l.id
		ORDER BY l.created_at ASC`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch lists: %w", err)
	}
	defer rows.Close()

	lists := []model.List{}
	for rows.Next() {
		var l model.List
		err := rows.Scan(&l.ID, &l.Name, &l.Color, &l.CreatedAt, &l.TotalCount, &l.IncompleteCount)
		if err != nil {
			return nil, fmt.Errorf("failed to scan list: %w", err)
		}
		lists = append(lists, l)
	}
	return lists, nil
}


func (s *SQLiteStore) GetListByID(id string) (*model.List, error) {
	query := `
		SELECT 
			l.id, l.name, l.color, l.created_at, 
			COUNT(t.id) as total_count,
			COALESCE(SUM(CASE WHEN t.status = 0 THEN 1 ELSE 0 END), 0) as incomplete_count
		FROM lists l
		LEFT JOIN tasks t ON (l.id = t.list_id OR (l.id = 'default' AND t.list_id IS NULL))
		WHERE l.id = ?
		GROUP BY l.id`
	var l model.List
	err := s.db.QueryRow(query, id).Scan(&l.ID, &l.Name, &l.Color, &l.CreatedAt, &l.TotalCount, &l.IncompleteCount)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get list: %w", err)
	}
	return &l, nil
}


func (s *SQLiteStore) UpdateList(list *model.List) error {
	query := `UPDATE lists SET name = ?, color = ? WHERE id = ?`
	res, err := s.db.Exec(query, list.Name, list.Color, list.ID)
	if err != nil {
		return fmt.Errorf("failed to update list: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("list not found")
	}
	return nil
}

func (s *SQLiteStore) DeleteList(id string) error {
	// Reassign tasks to default
	reassignQuery := "UPDATE tasks SET list_id = NULL WHERE list_id = ?"
	if _, err := s.db.Exec(reassignQuery, id); err != nil {
		return fmt.Errorf("failed to reassign tasks: %w", err)
	}

	query := "DELETE FROM lists WHERE id = ?"
	res, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete list: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("list not found")
	}
	return nil
}

