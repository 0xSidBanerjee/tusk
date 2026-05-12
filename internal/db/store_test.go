package db

import (
	"os"
	"testing"
	"time"

	"github.com/0xSidBanerjee/tusk/internal/model"
)

func TestSQLiteStore(t *testing.T) {
	dbFile := "test_store.db"
	defer os.Remove(dbFile)

	db, err := InitDB(dbFile)
	if err != nil {
		t.Fatalf("Failed to init db: %v", err)
	}
	defer db.Close()

	store := NewSQLiteStore(db)

	// Test Create
	task := &model.Task{
		Title: "Test Task",
	}
	err = store.Create(task)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if task.ID == "" {
		t.Error("Expected task ID to be set")
	}

	// Test GetByID
	got, err := store.GetByID(task.ID)
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got.Title != task.Title {
		t.Errorf("Expected title %s, got %s", task.Title, got.Title)
	}

	// Test Update
	got.Title = "Updated Title"
	err = store.Update(got)
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	updated, _ := store.GetByID(task.ID)
	if updated.Title != "Updated Title" {
		t.Errorf("Expected title Updated Title, got %s", updated.Title)
	}

	// Test GetAll and Filtering
	priority := model.PriorityHigh
	task2 := &model.Task{Title: "Task 2", Priority: &priority}
	store.Create(task2)

	tasks, total, err := store.GetAll(GetAllFilters{Priority: &priority})
	if err != nil {
		t.Fatalf("GetAll with filter failed: %v", err)
	}
	if total != 1 {
		t.Errorf("Expected total 1, got %d", total)
	}
	if len(tasks) != 1 {
		t.Errorf("Expected 1 task, got %d", len(tasks))
	}

	// Test Delete
	err = store.Delete(task.ID)
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	deleted, _ := store.GetByID(task.ID)
	if deleted != nil {
		t.Error("Expected task to be deleted")
	}
}

func TestTaskSorting(t *testing.T) {
	dbFile := "test_sorting.db"
	defer os.Remove(dbFile)

	db, err := InitDB(dbFile)
	if err != nil {
		t.Fatalf("Failed to init db: %v", err)
	}
	defer db.Close()

	store := NewSQLiteStore(db)

	now := time.Now().UTC()
	overdue := now.Add(-24 * time.Hour)
	future := now.Add(24 * time.Hour)
	priorityHigh := model.PriorityHigh

	tasks := []model.Task{
		{Title: "Completed Task", Status: true},
		{Title: "Incomplete No Deadline", Status: false},
		{Title: "Incomplete High Priority", Priority: &priorityHigh, Status: false},
		{Title: "Future Task", Deadline: &future, Status: false},
		{Title: "Overdue Task", Deadline: &overdue, Status: false},
	}

	for _, task := range tasks {
		if err := store.Create(&task); err != nil {
			t.Fatalf("Failed to create task %s: %v", task.Title, err)
		}
	}

	gotTasks, _, err := store.GetAll(GetAllFilters{Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("GetAll failed: %v", err)
	}

	expectedOrder := []string{
		"Overdue Task",
		"Future Task",
		"Incomplete High Priority",
		"Incomplete No Deadline",
		"Completed Task",
	}

	if len(gotTasks) != len(expectedOrder) {
		t.Fatalf("Expected %d tasks, got %d", len(expectedOrder), len(gotTasks))
	}

	for i, task := range gotTasks {
		if task.Title != expectedOrder[i] {
			t.Errorf("At index %d: expected %s, got %s", i, expectedOrder[i], task.Title)
		}
	}
}

