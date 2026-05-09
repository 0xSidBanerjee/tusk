package db

import (
	"os"
	"testing"
)

func TestInitDB(t *testing.T) {
	dbFile := "test_todo.db"
	defer os.Remove(dbFile)

	db, err := InitDB(dbFile)
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Check if table exists
	var name string
	err = db.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'").Scan(&name)
	if err != nil {
		t.Fatalf("Failed to find tasks table: %v", err)
	}

	if name != "tasks" {
		t.Errorf("Expected table name 'tasks', got '%s'", name)
	}
}
