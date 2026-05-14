package export

import (
	"archive/zip"
	"bytes"
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pelletier/go-toml/v2"
	"gopkg.in/yaml.v3"
)

type ImportResult struct {
	ListsCreated  int
	ListsMerged   int
	TasksImported int
	TasksSkipped  []SkippedTask
}

type SkippedTask struct {
	Title  string
	Reason string
}

func Import(database *sql.DB, format string, data []byte) (*ImportResult, error) {
	var exportData ExportData
	format = strings.ToUpper(format)

	switch format {
	case "JSON":
		if err := json.Unmarshal(data, &exportData); err != nil {
			return nil, fmt.Errorf("failed to unmarshal JSON: %w", err)
		}
	case "YAML":
		if err := yaml.Unmarshal(data, &exportData); err != nil {
			return nil, fmt.Errorf("failed to unmarshal YAML: %w", err)
		}
	case "TOML":
		type tomlExportTask struct {
			Title       string     `toml:"Title"`
			Description *string    `toml:"Description,omitempty"`
			ListName    string     `toml:"ListName"`
			Priority    *string    `toml:"Priority,omitempty"`
			Deadline    time.Time  `toml:"Deadline,omitempty"`
			Status      bool       `toml:"Status"`
			CompletedAt time.Time  `toml:"CompletedAt,omitempty"`
			CreatedAt   time.Time  `toml:"CreatedAt"`
			UpdatedAt   time.Time  `toml:"UpdatedAt,omitempty"`
		}
		type tomlExportData struct {
			Lists []ExportList     `toml:"lists"`
			Tasks []tomlExportTask `toml:"tasks"`
		}
		var td tomlExportData
		if err := toml.Unmarshal(data, &td); err != nil {
			return nil, fmt.Errorf("failed to unmarshal TOML: %w", err)
		}
		
		exportData.Lists = td.Lists
		for _, tt := range td.Tasks {
			var deadline *time.Time
			if !tt.Deadline.IsZero() {
				d := tt.Deadline
				deadline = &d
			}
			var updatedAt *time.Time
			if !tt.UpdatedAt.IsZero() {
				u := tt.UpdatedAt
				updatedAt = &u
			}
			var completedAt *time.Time
			if !tt.CompletedAt.IsZero() {
				c := tt.CompletedAt
				completedAt = &c
			}
			exportData.Tasks = append(exportData.Tasks, ExportTask{
				Title:       tt.Title,
				Description: tt.Description,
				ListName:    tt.ListName,
				Priority:    tt.Priority,
				Deadline:    deadline,
				Status:      tt.Status,
				CompletedAt: completedAt,
				CreatedAt:   tt.CreatedAt,
				UpdatedAt:   updatedAt,
			})
		}
	case "CSV":
		// Check if it's a ZIP (from API) or we need to handle it differently
		// For now, let's assume ZIP if it starts with PK
		if bytes.HasPrefix(data, []byte("PK\x03\x04")) {
			var err error
			exportData, err = parseCSVZip(data)
			if err != nil {
				return nil, err
			}
		} else {
			return nil, errors.New("CSV import requires a ZIP file containing tasks.csv and lists.csv")
		}
	default:
		return nil, fmt.Errorf("unsupported format: %s", format)
	}

	return executeImport(database, exportData)
}

// For CLI CSV import where we have separate buffers
func ImportCSV(database *sql.DB, tasksData, listsData []byte) (*ImportResult, error) {
	exportData, err := parseCSVBuffers(tasksData, listsData)
	if err != nil {
		return nil, err
	}
	return executeImport(database, exportData)
}

func parseCSVZip(data []byte) (ExportData, error) {
	reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return ExportData{}, fmt.Errorf("failed to open zip: %w", err)
	}

	var tasksData, listsData []byte
	for _, file := range reader.File {
		if strings.HasSuffix(file.Name, "tasks.csv") {
			rc, err := file.Open()
			if err != nil {
				return ExportData{}, err
			}
			tasksData, _ = io.ReadAll(rc)
			rc.Close()
		} else if strings.HasSuffix(file.Name, "lists.csv") {
			rc, err := file.Open()
			if err != nil {
				return ExportData{}, err
			}
			listsData, _ = io.ReadAll(rc)
			rc.Close()
		}
	}

	return parseCSVBuffers(tasksData, listsData)
}

func parseCSVBuffers(tasksData, listsData []byte) (ExportData, error) {
	var res ExportData

	if listsData != nil {
		r := csv.NewReader(bytes.NewReader(listsData))
		records, err := r.ReadAll()
		if err != nil {
			return res, fmt.Errorf("failed to read lists CSV: %w", err)
		}
		if len(records) > 0 {
			// Skip header
			for _, rec := range records[1:] {
				if len(rec) < 2 {
					continue
				}
				res.Lists = append(res.Lists, ExportList{
					Name:  rec[0],
					Color: rec[1],
				})
			}
		}
	}

	if tasksData != nil {
		r := csv.NewReader(bytes.NewReader(tasksData))
		records, err := r.ReadAll()
		if err != nil {
			return res, fmt.Errorf("failed to read tasks CSV: %w", err)
		}
		if len(records) > 0 {
			// Skip header: Title, Description, ListName, Priority, Deadline, Status, CompletedAt, CreatedAt, UpdatedAt
			for _, rec := range records[1:] {
				if len(rec) < 9 {
					continue
				}
				title := rec[0]
				desc := rec[1]
				listName := rec[2]
				prio := rec[3]
				deadlineStr := rec[4]
				statusStr := rec[5]
				completedAtStr := rec[6]
				createdAtStr := rec[7]
				updatedAtStr := rec[8]

				var description *string
				if desc != "" {
					description = &desc
				}
				var priority *string
				if prio != "" {
					priority = &prio
				}
				var deadline *time.Time
				if deadlineStr != "" {
					t, _ := time.Parse(time.RFC3339, deadlineStr)
					deadline = &t
				}
				status := statusStr == "true"
				var completedAt *time.Time
				if completedAtStr != "" {
					t, _ := time.Parse(time.RFC3339, completedAtStr)
					completedAt = &t
				}
				createdAt, _ := time.Parse(time.RFC3339, createdAtStr)
				var updatedAt *time.Time
				if updatedAtStr != "" {
					t, _ := time.Parse(time.RFC3339, updatedAtStr)
					updatedAt = &t
				}

				res.Tasks = append(res.Tasks, ExportTask{
					Title:       title,
					Description: description,
					ListName:    listName,
					Priority:    priority,
					Deadline:    deadline,
					Status:      status,
					CompletedAt: completedAt,
					CreatedAt:   createdAt,
					UpdatedAt:   updatedAt,
				})
			}
		}
	}

	return res, nil
}

func executeImport(database *sql.DB, data ExportData) (*ImportResult, error) {
	tx, err := database.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	result := &ImportResult{
		TasksSkipped: make([]SkippedTask, 0),
	}

	listNameToID := make(map[string]string)
	// Seed map with existing lists
	rows, err := tx.Query("SELECT id, name FROM lists")
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var id, name string
		rows.Scan(&id, &name)
		listNameToID[name] = id
	}
	rows.Close()

	// 1. Process Lists
	for _, l := range data.Lists {
		if id, exists := listNameToID[l.Name]; exists {
			listNameToID[l.Name] = id
			result.ListsMerged++
			continue
		}

		newID := uuid.New().String()
		_, err := tx.Exec("INSERT INTO lists (id, name, color, created_at) VALUES (?, ?, ?, ?)",
			newID, l.Name, l.Color, time.Now())
		if err != nil {
			return nil, fmt.Errorf("failed to create list %s: %w", l.Name, err)
		}
		listNameToID[l.Name] = newID
		result.ListsCreated++
	}

	// 2. Process Tasks
	type taskKey struct {
		Title     string
		CreatedAt time.Time
	}
	existingTasks := make([]taskKey, 0)
	rows, err = tx.Query("SELECT title, created_at FROM tasks")
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var title string
		var createdAt time.Time
		if err := rows.Scan(&title, &createdAt); err == nil {
			existingTasks = append(existingTasks, taskKey{Title: title, CreatedAt: createdAt.UTC()})
		}
	}
	rows.Close()

	for _, t := range data.Tasks {
		// Deduplication check: Title + CreatedAt
		exists := false
		for _, et := range existingTasks {
			if et.Title == t.Title && et.CreatedAt.Truncate(time.Second).Equal(t.CreatedAt.Truncate(time.Second)) {
				exists = true
				break
			}
		}

		if exists {
			result.TasksSkipped = append(result.TasksSkipped, SkippedTask{
				Title:  t.Title,
				Reason: "already exists",
			})
			continue
		}

		var listID *string
		if t.ListName != "" {
			if id, ok := listNameToID[t.ListName]; ok {
				listID = &id
			}
		}

		updatedAt := t.CreatedAt
		if t.UpdatedAt != nil {
			updatedAt = *t.UpdatedAt
		}

		var completedAt *time.Time
		if t.CompletedAt != nil {
			ct := t.CompletedAt.UTC()
			completedAt = &ct
		}

		newID := uuid.New().String()
		_, err = tx.Exec(`INSERT INTO tasks (id, list_id, title, description, priority, deadline, status, completed_at, created_at, updated_at) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			newID, listID, t.Title, t.Description, t.Priority, t.Deadline, t.Status, completedAt, t.CreatedAt.UTC(), updatedAt.UTC())
		if err != nil {
			return nil, fmt.Errorf("failed to import task %s: %w", t.Title, err)
		}
		result.TasksImported++
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return result, nil
}
