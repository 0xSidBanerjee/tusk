/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/export"
	"github.com/spf13/cobra"
)

var (
	exportFormat string
	exportPath   string
)

// exportCmd represents the export command
var exportCmd = &cobra.Command{
	Use:   "export",
	Short: "Export the todo list to common formats",
	PreRunE: func(cmd *cobra.Command, args []string) error {
		format := strings.ToUpper(exportFormat)
		switch format {
		case "CSV", "JSON", "YAML", "TOML":
			exportFormat = format
			return nil
		default:
			return fmt.Errorf("invalid export format: %s. Supported formats: CSV, JSON, YAML, TOML", exportFormat)
		}
	},
	Run: func(cmd *cobra.Command, args []string) {
		database, err := db.InitDB(dbFile)
		if err != nil {
			fmt.Printf("Error: failed to initialize database: %v\n", err)
			os.Exit(1)
		}
		defer database.Close()

		store := db.NewSQLiteStore(database)
		// Fetch all tasks with no limits
		tasks, _, err := store.GetAllTasks(db.GetAllFilters{Page: 1, PageSize: 1000000})
		if err != nil {
			fmt.Printf("Error: failed to fetch tasks: %v\n", err)
			os.Exit(1)
		}

		lists, err := store.GetAllLists()
		if err != nil {
			fmt.Printf("Error: failed to fetch lists: %v\n", err)
			os.Exit(1)
		}

		formatter, err := export.GetFormatter(exportFormat)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}

		files, err := formatter.Format(lists, tasks)
		if err != nil {
			fmt.Printf("Error: failed to format export: %v\n", err)
			os.Exit(1)
		}

		outputBase := exportPath
		info, err := os.Stat(exportPath)
		if err == nil && info.IsDir() {
			outputBase = filepath.Join(exportPath, "tusk_export")
		}

		for filename, content := range files {
			var finalPath string
			if exportFormat == "CSV" {
				// For CSV, we have tasks.csv and lists.csv
				nameWithoutExt := strings.TrimSuffix(filepath.Base(filename), ".csv")
				finalPath = fmt.Sprintf("%s_%s.csv", strings.TrimSuffix(outputBase, ".csv"), nameWithoutExt)
			} else {
				if strings.HasSuffix(strings.ToLower(outputBase), "."+strings.ToLower(exportFormat)) {
					finalPath = outputBase
				} else {
					finalPath = fmt.Sprintf("%s.%s", outputBase, strings.ToLower(exportFormat))
				}
			}

			if err := os.WriteFile(finalPath, content, 0644); err != nil {
				fmt.Printf("Error: failed to write file %s: %v\n", finalPath, err)
				os.Exit(1)
			}
			fmt.Printf("Successfully exported to %s\n", finalPath)
		}
	},
}

func init() {
	rootCmd.AddCommand(exportCmd)

	exportCmd.Flags().StringVarP(&exportFormat, "format", "f", "CSV", "The format to be exported as (CSV, JSON, YAML, TOML)")
	exportCmd.Flags().StringVarP(&exportPath, "export-path", "l", ".", "The location and name of the output file")
}
