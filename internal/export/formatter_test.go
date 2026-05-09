package export

import (
	"os"
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

	formats := []string{"JSON", "CSV", "YAML", "TOML"}

	for _, format := range formats {
		t.Run(format, func(t *testing.T) {
			formatter, err := GetFormatter(format)
			if err != nil {
				t.Fatalf("Failed to get formatter: %v", err)
			}

			path := "test_export." + format
			defer os.Remove(path)

			err = formatter.Export(tasks, path)
			if err != nil {
				t.Fatalf("Export failed: %v", err)
			}

			if _, err := os.Stat(path); os.IsNotExist(err) {
				t.Errorf("File %s was not created", path)
			}
		})
	}
}
