package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/export"
	"github.com/spf13/cobra"
)

var (
	importFormat    string
	importInputFile string
	importTasksFile string
	importListsFile string
)

var importCmd = &cobra.Command{
	Use:   "import",
	Short: "Import tasks and lists from a file",
	Run: func(cmd *cobra.Command, args []string) {
		database, err := db.InitDB(dbFile)
		if err != nil {
			fmt.Printf("Error: failed to initialize database: %v\n", err)
			os.Exit(1)
		}
		defer database.Close()

		var result *export.ImportResult
		format := strings.ToUpper(importFormat)

		if format == "CSV" {
			if importTasksFile == "" || importListsFile == "" {
				fmt.Println("Error: CSV import requires both --tasks-file and --lists-file")
				os.Exit(1)
			}
			tasksData, err := os.ReadFile(importTasksFile)
			if err != nil {
				fmt.Printf("Error: failed to read tasks file: %v\n", err)
				os.Exit(1)
			}
			listsData, err := os.ReadFile(importListsFile)
			if err != nil {
				fmt.Printf("Error: failed to read lists file: %v\n", err)
				os.Exit(1)
			}
			result, err = export.ImportCSV(database, tasksData, listsData)
			if err != nil {
				fmt.Printf("Error: import failed: %v\n", err)
				os.Exit(1)
			}
		} else {
			if importInputFile == "" {
				fmt.Println("Error: --input-file is required")
				os.Exit(1)
			}
			data, err := os.ReadFile(importInputFile)
			if err != nil {
				fmt.Printf("Error: failed to read input file: %v\n", err)
				os.Exit(1)
			}
			result, err = export.Import(database, format, data)
			if err != nil {
				fmt.Printf("Error: import failed: %v\n", err)
				os.Exit(1)
			}
		}

		fmt.Println("Import complete.")
		fmt.Printf("  Lists created:  %d\n", result.ListsCreated)
		fmt.Printf("  Lists merged:   %d\n", result.ListsMerged)
		fmt.Printf("  Tasks imported: %d\n", result.TasksImported)
		fmt.Printf("  Tasks skipped:  %d\n", len(result.TasksSkipped))
		for _, skipped := range result.TasksSkipped {
			fmt.Printf("    - %q (%s)\n", skipped.Title, skipped.Reason)
		}
	},
}

func init() {
	rootCmd.AddCommand(importCmd)

	importCmd.Flags().StringVarP(&importFormat, "format", "f", "", "The format of the input file (CSV, JSON, YAML, TOML)")
	importCmd.MarkFlagRequired("format")

	importCmd.Flags().StringVarP(&importInputFile, "input-file", "i", "", "The path to the input file (not required for CSV)")
	
	// CSV specific flags
	importCmd.Flags().StringVar(&importTasksFile, "tasks-file", "", "The path to the tasks CSV file")
	importCmd.Flags().StringVar(&importListsFile, "lists-file", "", "The path to the lists CSV file")

	// Allow overriding db file
	importCmd.Flags().StringVarP(&dbFile, "db-file", "d", "todo.db", "The path to sqlite database file to use")
}
