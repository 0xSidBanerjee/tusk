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
	err = store.CreateTask(task)
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	if task.ID == "" {
		t.Error("Expected task ID to be set")
	}
	if task.ListID != nil {
		t.Errorf("Expected nil list ID for new unassigned task, got %s", *task.ListID)
	}

	// Test GetTaskByID
	got, err := store.GetTaskByID(task.ID)
	if err != nil {
		t.Fatalf("GetTaskByID failed: %v", err)
	}
	if got.Title != task.Title {
		t.Errorf("Expected title %s, got %s", task.Title, got.Title)
	}

	// Test Update
	got.Title = "Updated Title"
	err = store.UpdateTask(got)
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	updated, _ := store.GetTaskByID(task.ID)
	if updated.Title != "Updated Title" {
		t.Errorf("Expected title Updated Title, got %s", updated.Title)
	}

	// Test GetAll and Filtering
	priority := model.PriorityHigh
	task2 := &model.Task{Title: "Task 2", Priority: &priority}
	store.CreateTask(task2)

	tasks, total, err := store.GetAllTasks(GetAllFilters{Priority: &priority})
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
	err = store.DeleteTask(task.ID)
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	deleted, _ := store.GetTaskByID(task.ID)
	if deleted != nil {
		t.Error("Expected task to be deleted")
	}
}

func TestListStore(t *testing.T) {
	dbFile := "test_list.db"
	defer os.Remove(dbFile)

	db, err := InitDB(dbFile)
	if err != nil {
		t.Fatalf("Failed to init db: %v", err)
	}
	defer db.Close()

	store := NewSQLiteStore(db)

	// Test CreateList
	list := &model.List{
		Name:  "Work",
		Color: "#FF0000",
	}
	if err := store.CreateList(list); err != nil {
		t.Fatalf("CreateList failed: %v", err)
	}

	// Test GetListByID
	got, err := store.GetListByID(list.ID)
	if err != nil {
		t.Fatalf("GetListByID failed: %v", err)
	}
	if got.Name != "Work" {
		t.Errorf("Expected name Work, got %s", got.Name)
	}

	// Test UpdateList
	got.Name = "Business"
	if err := store.UpdateList(got); err != nil {
		t.Fatalf("UpdateList failed: %v", err)
	}
	updated, _ := store.GetListByID(list.ID)
	if updated.Name != "Business" {
		t.Errorf("Expected name Business, got %s", updated.Name)
	}

	// Test GetAllLists and task counts
	task := &model.Task{Title: "Task in Business", ListID: &list.ID}
	store.CreateTask(task)

	lists, err := store.GetAllLists()
	if err != nil {
		t.Fatalf("GetAllLists failed: %v", err)
	}
	// Total lists should be 2 (Inbox + Business)
	if len(lists) != 2 {
		t.Errorf("Expected 2 lists, got %d", len(lists))
	}

	found := false
	for _, l := range lists {
		if l.ID == list.ID {
			found = true
			if l.TotalCount != 1 {
				t.Errorf("Expected total count 1 for list %s, got %d", l.Name, l.TotalCount)
			}
			if l.IncompleteCount != 1 {
				t.Errorf("Expected incomplete count 1 for list %s, got %d", l.Name, l.IncompleteCount)
			}
		}
	}
	if !found {
		t.Error("Did not find created list in GetAllLists")
	}

	// Test DeleteList and task reassignment
	if err := store.DeleteList(list.ID); err != nil {
		t.Fatalf("DeleteList failed: %v", err)
	}
	
	// Task should now be in 'default' list
	t1, _ := store.GetTaskByID(task.ID)
	if t1.ListID != nil {
		t.Errorf("Expected task list_id to be nil after list deletion, got %s", *t1.ListID)
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
		if err := store.CreateTask(&task); err != nil {
			t.Fatalf("Failed to create task %s: %v", task.Title, err)
		}
	}

	gotTasks, _, err := store.GetAllTasks(GetAllFilters{Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("GetAllTasks failed: %v", err)
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


