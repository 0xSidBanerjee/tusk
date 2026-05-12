package db

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

func InitDB(dbFile string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dbFile)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	if _, err := db.Exec("PRAGMA journal_mode=WAL;"); err != nil {
		return nil, fmt.Errorf("failed to enable WAL mode: %w", err)
	}

	if err := createSchema(db); err != nil {
		return nil, fmt.Errorf("failed to create schema: %w", err)
	}

	return db, nil
}

func createSchema(db *sql.DB) error {
	listsQuery := `
	CREATE TABLE IF NOT EXISTS lists (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		color TEXT NOT NULL,
		created_at DATETIME NOT NULL DEFAULT (datetime('now'))
	);`

	if _, err := db.Exec(listsQuery); err != nil {
		return fmt.Errorf("failed to create lists table: %w", err)
	}

	uniqueIndexQuery := `CREATE UNIQUE INDEX IF NOT EXISTS idx_lists_name ON lists(name)`
	if _, err := db.Exec(uniqueIndexQuery); err != nil {
		return fmt.Errorf("failed to create unique index on lists name: %w", err)
	}

	// Seed Inbox
	seedQuery := `INSERT OR IGNORE INTO lists (id, name, color) VALUES ('default', 'Inbox', '#6366f1')`
	if _, err := db.Exec(seedQuery); err != nil {
		return fmt.Errorf("failed to seed default list: %w", err)
	}

	tasksQuery := `
	CREATE TABLE IF NOT EXISTS tasks (
		id TEXT PRIMARY KEY,
		list_id TEXT REFERENCES lists(id),
		title TEXT NOT NULL,
		description TEXT,
		priority TEXT,
		deadline DATETIME,
		status BOOLEAN NOT NULL DEFAULT 0,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL
	);`

	if _, err := db.Exec(tasksQuery); err != nil {
		return fmt.Errorf("failed to create tasks table: %w", err)
	}

	// Migration: Check if list_id is nullable
	var isNullable bool
	rows, err := db.Query("PRAGMA table_info(tasks)")
	if err != nil {
		return fmt.Errorf("failed to check tasks table info: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name string
		var dtype string
		var notnull int
		var dfltValue interface{}
		var pk int
		if err := rows.Scan(&cid, &name, &dtype, &notnull, &dfltValue, &pk); err != nil {
			return err
		}
		if name == "list_id" && notnull == 0 {
			isNullable = true
			break
		}
	}

	if !isNullable {
		// SQLite doesn't support ALTER COLUMN to change NULL/NOT NULL
		// We need to recreate the table
		migrationQueries := []string{
			"PRAGMA foreign_keys=off;",
			"BEGIN TRANSACTION;",
			`CREATE TABLE tasks_new (
				id TEXT PRIMARY KEY,
				list_id TEXT REFERENCES lists(id),
				title TEXT NOT NULL,
				description TEXT,
				priority TEXT,
				deadline DATETIME,
				status BOOLEAN NOT NULL DEFAULT 0,
				created_at DATETIME NOT NULL,
				updated_at DATETIME NOT NULL
			);`,
			"INSERT INTO tasks_new (id, list_id, title, description, priority, deadline, status, created_at, updated_at) SELECT id, list_id, title, description, priority, deadline, status, created_at, updated_at FROM tasks;",
			"DROP TABLE tasks;",
			"ALTER TABLE tasks_new RENAME TO tasks;",
			"COMMIT;",
			"PRAGMA foreign_keys=on;",
		}
		for _, q := range migrationQueries {
			if _, err := db.Exec(q); err != nil {
				return fmt.Errorf("failed to migrate tasks table (recreation): %w", err)
			}
		}
	}

	return nil
}

