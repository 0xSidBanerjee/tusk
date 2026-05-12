package model

import (
	"time"
)

type Priority string

const (
	PriorityHigh   Priority = "High"
	PriorityMedium Priority = "Medium"
	PriorityLow    Priority = "Low"
)

func (p Priority) IsValid() bool {
	switch p {
	case PriorityHigh, PriorityMedium, PriorityLow:
		return true
	}
	return false
}

type List struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	Color           string    `json:"color"`
	CreatedAt       time.Time `json:"created_at"`
	TotalCount      int       `json:"total_count"`
	IncompleteCount int       `json:"incomplete_count"`
}

type Task struct {
	ID          string     `json:"id"`
	ListID      *string    `json:"list_id"`
	Title       string     `json:"title"`
	Description *string    `json:"description,omitempty"`
	Priority    *Priority  `json:"priority,omitempty"`
	Deadline    *time.Time `json:"deadline,omitempty"`
	Status      bool       `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}
