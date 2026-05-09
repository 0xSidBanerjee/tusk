package export

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/0xSidBanerjee/tusk/internal/model"
	"github.com/pelletier/go-toml/v2"
	"gopkg.in/yaml.v3"
)

type Formatter interface {
	Export(tasks []model.Task, path string) error
}

func GetFormatter(format string) (Formatter, error) {
	switch format {
	case "CSV":
		return &CSVFormatter{}, nil
	case "JSON":
		return &JSONFormatter{}, nil
	case "YAML":
		return &YAMLFormatter{}, nil
	case "TOML":
		return &TOMLFormatter{}, nil
	default:
		return nil, fmt.Errorf("unsupported format: %s", format)
	}
}

type JSONFormatter struct{}

func (f *JSONFormatter) Export(tasks []model.Task, path string) error {
	data, err := json.MarshalIndent(tasks, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

type CSVFormatter struct{}

func (f *CSVFormatter) Export(tasks []model.Task, path string) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Header
	err = writer.Write([]string{"ID", "Title", "Description", "Priority", "Deadline", "Status", "CreatedAt", "UpdatedAt"})
	if err != nil {
		return err
	}

	for _, t := range tasks {
		desc := ""
		if t.Description != nil {
			desc = *t.Description
		}
		prio := ""
		if t.Priority != nil {
			prio = string(*t.Priority)
		}
		deadline := ""
		if t.Deadline != nil {
			deadline = t.Deadline.Format(time.RFC3339)
		}

		record := []string{
			t.ID,
			t.Title,
			desc,
			prio,
			deadline,
			fmt.Sprintf("%v", t.Status),
			t.CreatedAt.Format(time.RFC3339),
			t.UpdatedAt.Format(time.RFC3339),
		}
		if err := writer.Write(record); err != nil {
			return err
		}
	}
	return nil
}

type YAMLFormatter struct{}

func (f *YAMLFormatter) Export(tasks []model.Task, path string) error {
	data, err := yaml.Marshal(tasks)
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

type TOMLFormatter struct{}

func (f *TOMLFormatter) Export(tasks []model.Task, path string) error {
	// TOML requires a top-level table/struct for arrays
	wrapper := struct {
		Tasks []model.Task `toml:"tasks"`
	}{Tasks: tasks}

	data, err := toml.Marshal(wrapper)
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}
