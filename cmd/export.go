/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

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

		formatter, err := export.GetFormatter(exportFormat)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			os.Exit(1)
		}

		finalPath := exportPath
		info, err := os.Stat(exportPath)
		if err == nil && info.IsDir() {
			filename := fmt.Sprintf("tusk_export_%d.%s", time.Now().Unix(), strings.ToLower(exportFormat))
			finalPath = filepath.Join(exportPath, filename)
		}

		if err := formatter.Export(tasks, finalPath); err != nil {
			fmt.Printf("Error: failed to export: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("Successfully exported %d tasks to %s\n", len(tasks), finalPath)
	},
}

func init() {
	rootCmd.AddCommand(exportCmd)

	exportCmd.Flags().StringVarP(&exportFormat, "format", "f", "CSV", "The format to be exported as (CSV, JSON, YAML, TOML)")
	exportCmd.Flags().StringVarP(&exportPath, "export-path", "l", ".", "The location and name of the output file")
}
