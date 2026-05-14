package util

import (
	"strings"

	"github.com/0xSidBanerjee/tusk/internal/model"
)

// ParseQuickInput parses a string in the format "Title | Priority | Deadline"
// and returns a Task object with the parsed fields.
func ParseQuickInput(raw string) (*model.Task, error) {
	parts := strings.Split(raw, "|")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}

	task := &model.Task{
		Title:  parts[0],
		Status: false,
	}

	if len(parts) == 1 {
		return task, nil
	}

	var priority *model.Priority
	var deadlineStr string

	if len(parts) >= 3 {
		p := ParsePriority(parts[1])
		if p != nil {
			priority = p
		}
		deadlineStr = parts[2]
	} else if len(parts) == 2 {
		p := ParsePriority(parts[1])
		if p != nil {
			priority = p
		} else {
			deadlineStr = parts[1]
		}
	}

	task.Priority = priority
	if deadlineStr != "" {
		d, err := ParseDeadline(deadlineStr)
		if err == nil {
			task.Deadline = d
		}
	}

	return task, nil
}

func ParsePriority(p string) *model.Priority {
	normalized := strings.ToLower(p)
	var priority model.Priority
	switch normalized {
	case "high":
		priority = model.PriorityHigh
	case "medium":
		priority = model.PriorityMedium
	case "low":
		priority = model.PriorityLow
	default:
		return nil
	}
	return &priority
}
