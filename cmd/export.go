/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"archive/zip"
	"bytes"
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
	Short: "Export tasks and lists to a file",
	Long: `Export all tasks and lists from the Tusk database to a file.

Supported formats: JSON, YAML, TOML, CSV
CSV exports produce a ZIP archive containing two files: tasks.csv and lists.csv.

Examples:
  tusk export --format json --export-path ./tusk_backup.json
  tusk export --format csv --export-path ./tusk_backup`,
	PreRunE: func(cmd *cobra.Command, args []string) error {
		if exportFormat == "" {
			return fmt.Errorf("--format is required. Choose one of: json, yaml, toml, csv")
		}
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
		tasks, _, err := store.GetAllTasks(db.GetAllFilters{Page: 1, PageSize: 1000000, Status: "all"})
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

		if exportFormat == "CSV" {
			// Create a ZIP archive
			zipBuf := new(bytes.Buffer)
			zipWriter := zip.NewWriter(zipBuf)

			for filename, content := range files {
				f, err := zipWriter.Create(filename)
				if err != nil {
					fmt.Printf("Error: failed to create zip entry %s: %v\n", filename, err)
					os.Exit(1)
				}
				if _, err := f.Write(content); err != nil {
					fmt.Printf("Error: failed to write to zip entry %s: %v\n", filename, err)
					os.Exit(1)
				}
			}

			if err := zipWriter.Close(); err != nil {
				fmt.Printf("Error: failed to close zip writer: %v\n", err)
				os.Exit(1)
			}

			finalPath := outputBase
			if !strings.HasSuffix(strings.ToLower(finalPath), ".zip") {
				finalPath += ".zip"
			}

			if err := os.WriteFile(finalPath, zipBuf.Bytes(), 0644); err != nil {
				fmt.Printf("Error: failed to write zip file %s: %v\n", finalPath, err)
				os.Exit(1)
			}
			fmt.Printf("Successfully exported to %s\n", finalPath)
		} else {
			for _, content := range files {
				var finalPath string
				if strings.HasSuffix(strings.ToLower(outputBase), "."+strings.ToLower(exportFormat)) {
					finalPath = outputBase
				} else {
					finalPath = fmt.Sprintf("%s.%s", outputBase, strings.ToLower(exportFormat))
				}

				if err := os.WriteFile(finalPath, content, 0644); err != nil {
					fmt.Printf("Error: failed to write file %s: %v\n", finalPath, err)
					os.Exit(1)
				}
				fmt.Printf("Successfully exported to %s\n", finalPath)
			}
		}
	},
}

func init() {
	rootCmd.AddCommand(exportCmd)

	exportCmd.Flags().StringVarP(&exportFormat, "format", "f", "", "Format to be exported as (json, yaml, toml, csv)")
	exportCmd.Flags().StringVarP(&exportPath, "export-path", "l", ".", "Location and name of the output file")
}
