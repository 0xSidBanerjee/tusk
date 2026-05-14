package export

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/0xSidBanerjee/tusk/internal/model"
	"github.com/pelletier/go-toml/v2"
	"gopkg.in/yaml.v3"
)

type ExportData struct {
	Lists []ExportList `json:"lists" yaml:"lists" toml:"lists"`
	Tasks []ExportTask `json:"tasks" yaml:"tasks" toml:"tasks"`
}

type ExportList struct {
	Name  string `json:"Name" yaml:"Name" toml:"Name"`
	Color string `json:"Color" yaml:"Color" toml:"Color"`
}

type ExportTask struct {
	Title       string     `json:"Title" yaml:"Title" toml:"Title"`
	Description *string    `json:"Description,omitempty" yaml:"Description,omitempty" toml:"Description,omitempty"`
	ListName    string     `json:"ListName" yaml:"ListName" toml:"ListName"`
	Priority    *string    `json:"Priority,omitempty" yaml:"Priority,omitempty" toml:"Priority,omitempty"`
	Deadline    *time.Time  `json:"Deadline,omitempty" yaml:"Deadline,omitempty" toml:"Deadline,omitempty"`
	Status      bool       `json:"Status" yaml:"Status" toml:"Status"`
	CompletedAt *time.Time `json:"CompletedAt,omitempty" yaml:"CompletedAt,omitempty" toml:"CompletedAt,omitempty"`
	CreatedAt   time.Time  `json:"CreatedAt" yaml:"CreatedAt" toml:"CreatedAt"`
	UpdatedAt   *time.Time `json:"UpdatedAt,omitempty" yaml:"UpdatedAt,omitempty" toml:"UpdatedAt,omitempty"`
}

type Formatter interface {
	Format(lists []model.List, tasks []model.Task) (map[string][]byte, error)
}

func GetFormatter(format string) (Formatter, error) {
	switch strings.ToUpper(format) {
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

func prepareExportData(lists []model.List, tasks []model.Task) ExportData {
	listMap := make(map[string]string)
	for _, l := range lists {
		listMap[l.ID] = l.Name
	}

	exportLists := make([]ExportList, 0, len(lists))
	for _, l := range lists {
		if l.ID == "default" {
			continue // Skip default list from [[lists]] section
		}
		exportLists = append(exportLists, ExportList{
			Name:  l.Name,
			Color: l.Color,
		})
	}

	exportTasks := make([]ExportTask, 0, len(tasks))
	for _, t := range tasks {
		listName := ""
		if t.ListID != nil {
			listName = listMap[*t.ListID]
		}

		var priority *string
		if t.Priority != nil {
			p := string(*t.Priority)
			priority = &p
		}

		var updatedAt *time.Time
		if !t.UpdatedAt.Equal(t.CreatedAt) {
			ut := t.UpdatedAt.UTC()
			updatedAt = &ut
		}

		var completedAt *time.Time
		if t.CompletedAt != nil {
			ct := t.CompletedAt.UTC()
			completedAt = &ct
		}

		exportTasks = append(exportTasks, ExportTask{
			Title:       t.Title,
			Description: t.Description,
			ListName:    listName,
			Priority:    priority,
			Deadline:    t.Deadline,
			Status:      t.Status,
			CompletedAt: completedAt,
			CreatedAt:   t.CreatedAt.UTC(),
			UpdatedAt:   updatedAt,
		})
	}

	return ExportData{
		Lists: exportLists,
		Tasks: exportTasks,
	}
}

type JSONFormatter struct{}

func (f *JSONFormatter) Format(lists []model.List, tasks []model.Task) (map[string][]byte, error) {
	data := prepareExportData(lists, tasks)
	buf, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return nil, err
	}
	return map[string][]byte{"export.json": buf}, nil
}

type CSVFormatter struct{}

func (f *CSVFormatter) Format(lists []model.List, tasks []model.Task) (map[string][]byte, error) {
	data := prepareExportData(lists, tasks)
	res := make(map[string][]byte)

	// Tasks CSV
	taskBuf := &strings.Builder{}
	taskWriter := csv.NewWriter(taskBuf)
	taskWriter.Write([]string{"Title", "Description", "ListName", "Priority", "Deadline", "Status", "CompletedAt", "CreatedAt", "UpdatedAt"})
	for _, t := range data.Tasks {
		desc := ""
		if t.Description != nil {
			desc = *t.Description
		}
		prio := ""
		if t.Priority != nil {
			prio = *t.Priority
		}
		deadline := ""
		if t.Deadline != nil {
			deadline = t.Deadline.Format(time.RFC3339)
		}
		completedAt := ""
		if t.CompletedAt != nil {
			completedAt = t.CompletedAt.Format(time.RFC3339)
		}
		updatedAt := ""
		if t.UpdatedAt != nil {
			updatedAt = t.UpdatedAt.Format(time.RFC3339)
		}

		taskWriter.Write([]string{
			t.Title,
			desc,
			t.ListName,
			prio,
			deadline,
			fmt.Sprintf("%v", t.Status),
			completedAt,
			t.CreatedAt.Format(time.RFC3339),
			updatedAt,
		})
	}
	taskWriter.Flush()
	res["tasks.csv"] = []byte(taskBuf.String())

	// Lists CSV
	listBuf := &strings.Builder{}
	listWriter := csv.NewWriter(listBuf)
	listWriter.Write([]string{"Name", "Color"})
	for _, l := range data.Lists {
		listWriter.Write([]string{l.Name, l.Color})
	}
	listWriter.Flush()
	res["lists.csv"] = []byte(listBuf.String())

	return res, nil
}

type YAMLFormatter struct{}

func (f *YAMLFormatter) Format(lists []model.List, tasks []model.Task) (map[string][]byte, error) {
	data := prepareExportData(lists, tasks)
	buf, err := yaml.Marshal(data)
	if err != nil {
		return nil, err
	}
	return map[string][]byte{"export.yaml": buf}, nil
}

type TOMLFormatter struct{}

func (f *TOMLFormatter) Format(lists []model.List, tasks []model.Task) (map[string][]byte, error) {
	data := prepareExportData(lists, tasks)
	
	// Convert to a TOML-friendly structure that avoids quoted dates
	type tomlExportList struct {
		Name  string `toml:"Name"`
		Color string `toml:"Color"`
	}

	type tomlExportTask struct {
		Title       string     `toml:"Title"`
		Description *string    `toml:"Description,omitempty"`
		ListName    string     `toml:"ListName"`
		Priority    *string    `toml:"Priority,omitempty"`
		Deadline    time.Time  `toml:"Deadline,omitempty"`
		Status      bool       `toml:"Status"`
		CompletedAt time.Time  `toml:"CompletedAt,omitempty"`
		CreatedAt   time.Time  `toml:"CreatedAt"`
		UpdatedAt   time.Time  `toml:"UpdatedAt,omitempty"`
	}

	type tomlExportData struct {
		Lists []tomlExportList `toml:"lists"`
		Tasks []tomlExportTask `toml:"tasks"`
	}

	res := tomlExportData{
		Lists: make([]tomlExportList, len(data.Lists)),
		Tasks: make([]tomlExportTask, len(data.Tasks)),
	}

	for i, l := range data.Lists {
		res.Lists[i] = tomlExportList{Name: l.Name, Color: l.Color}
	}

	for i, t := range data.Tasks {
		var deadline time.Time
		if t.Deadline != nil {
			deadline = *t.Deadline
		}
		var updatedAt time.Time
		if t.UpdatedAt != nil {
			updatedAt = *t.UpdatedAt
		}

		var completedAt time.Time
		if t.CompletedAt != nil {
			completedAt = *t.CompletedAt
		}

		res.Tasks[i] = tomlExportTask{
			Title:       t.Title,
			Description: t.Description,
			ListName:    t.ListName,
			Priority:    t.Priority,
			Deadline:    deadline,
			Status:      t.Status,
			CompletedAt: completedAt,
			CreatedAt:   t.CreatedAt,
			UpdatedAt:   updatedAt,
		}
	}

	buf, err := toml.Marshal(res)
	if err != nil {
		return nil, err
	}
	return map[string][]byte{"export.toml": buf}, nil
}
