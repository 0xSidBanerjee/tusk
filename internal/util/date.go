package util

import (
	"strings"
	"time"
)

// ParseDeadline parses a deadline string which can be an ISO date (YYYY-MM-DD)
// or natural language ("today", "tomorrow").
func ParseDeadline(d string) (*time.Time, error) {
	d = strings.TrimSpace(strings.ToLower(d))
	if d == "" {
		return nil, nil
	}

	now := time.Now()
	var result time.Time

	switch d {
	case "today":
		result = time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 0, now.Location())
	case "tomorrow":
		tomorrow := now.AddDate(0, 0, 1)
		result = time.Date(tomorrow.Year(), tomorrow.Month(), tomorrow.Day(), 23, 59, 59, 0, tomorrow.Location())
	default:
		// Try ISO 8601
		t, err := time.Parse("2006-01-02", d)
		if err != nil {
			return nil, err
		}
		// Default to end of day for the parsed date
		result = time.Date(t.Year(), t.Month(), t.Day(), 23, 59, 59, 0, now.Location())
	}

	return &result, nil
}

// FormatDeadline returns a human-friendly string for a deadline.
func FormatDeadline(t *time.Time) string {
	if t == nil {
		return ""
	}
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	deadline := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, t.Location())

	if deadline.Equal(today) {
		return "Today"
	}
	tomorrow := today.AddDate(0, 0, 1)
	if deadline.Equal(tomorrow) {
		return "Tomorrow"
	}
	yesterday := today.AddDate(0, 0, -1)
	if deadline.Equal(yesterday) {
		return "Yesterday"
	}

	return t.Format("Jan 02, 2006")
}

// IsOverdue returns true if the deadline is before now and the task is not completed.
func IsOverdue(t *time.Time, status bool) bool {
	if t == nil || status {
		return false
	}
	return t.Before(time.Now())
}
