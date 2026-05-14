/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/util"
	"github.com/spf13/cobra"
)

// addCmd represents the add command
var addCmd = &cobra.Command{
	Use:   "add \"task | priority | deadline\"",
	Short: "Add a new task using the quick-add syntax",
	Long: `Add a new task to your list using a simple, pipe-separated syntax.
This is the CLI equivalent of the quick-add input in the web UI, 
providing a consistent mental model across all interfaces.

Syntax:
  tusk add "Title | Priority | Deadline"

Priority:
  high, medium, low (default: medium)

Deadline:
  today, tomorrow, or a date in YYYY-MM-DD format.

Examples:
  tusk add "Buy groceries"
  tusk add "Fix login bug | high"
  tusk add "Submit report | high | tomorrow"
  tusk add "Renew gym membership | low | 2026-06-01"`,
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		rawInput := args[0]
		if strings.TrimSpace(rawInput) == "" {
			fmt.Println("Error: task title cannot be empty")
			os.Exit(1)
		}

		task, err := util.ParseQuickInput(rawInput)
		if err != nil {
			fmt.Printf("Error parsing input: %v\n", err)
			os.Exit(1)
		}

		database, err := db.InitDB(dbFile)
		if err != nil {
			fmt.Printf("Error initializing database: %v\n", err)
			os.Exit(1)
		}
		defer database.Close()

		store := db.NewSQLiteStore(database)
		if err := store.CreateTask(task); err != nil {
			fmt.Printf("Error creating task: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("✓ Task added: %s\n", task.Title)
	},
}

func init() {
	rootCmd.AddCommand(addCmd)
}
