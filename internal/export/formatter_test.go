package export

import (
	"testing"

	"github.com/0xSidBanerjee/tusk/internal/model"
)

func TestFormatters(t *testing.T) {
	tasks := []model.Task{
		{
			ID:    "1",
			Title: "Test Task",
		},
	}
	lists := []model.List{
		{
			ID:   "default",
			Name: "Inbox",
		},
	}

	formats := []string{"JSON", "CSV", "YAML", "TOML"}

	for _, format := range formats {
		t.Run(format, func(t *testing.T) {
			formatter, err := GetFormatter(format)
			if err != nil {
				t.Fatalf("Failed to get formatter: %v", err)
			}

			files, err := formatter.Format(lists, tasks)
			if err != nil {
				t.Fatalf("Format failed: %v", err)
			}

			if len(files) == 0 {
				t.Errorf("No files were generated for format %s", format)
			}
			
			if format == "CSV" && len(files) != 2 {
				t.Errorf("CSV should generate 2 files, got %d", len(files))
			}
		})
	}
}
