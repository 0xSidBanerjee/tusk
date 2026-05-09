package model

import (
	"testing"
)

func TestPriority_IsValid(t *testing.T) {
	tests := []struct {
		name     string
		priority Priority
		want     bool
	}{
		{"Valid High", PriorityHigh, true},
		{"Valid Medium", PriorityMedium, true},
		{"Valid Low", PriorityLow, true},
		{"Invalid empty", Priority(""), false},
		{"Invalid text", Priority("Urgent"), false},
		{"Invalid case", Priority("high"), false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.priority.IsValid(); got != tt.want {
				t.Errorf("Priority.IsValid() = %v, want %v", got, tt.want)
			}
		})
	}
}
