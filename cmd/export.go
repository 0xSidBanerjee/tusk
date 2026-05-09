/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"
	"strings"

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
		fmt.Printf("Exporting todo list in %s format to %s\n", exportFormat, exportPath)
	},
}

func init() {
	rootCmd.AddCommand(exportCmd)

	exportCmd.Flags().StringVarP(&exportFormat, "format", "f", "CSV", "The format to be exported as (CSV, JSON, YAML, TOML)")
	exportCmd.Flags().StringVarP(&exportPath, "export-path", "l", ".", "The location and name of the output file")
}
