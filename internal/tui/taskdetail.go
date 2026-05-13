package tui

import (
	"strings"
	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/model"
	"github.com/0xSidBanerjee/tusk/internal/util"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type detailModel struct {
	store *db.SQLiteStore
	task  model.Task
}

func newDetailModel(store *db.SQLiteStore) detailModel {
	return detailModel{store: store}
}

func (d detailModel) Init() tea.Cmd { return nil }

func (d detailModel) Update(msg tea.Msg, totalWidth int) (detailModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "e":
			task := d.task
			return d, func() tea.Msg { return stateMsg{state: viewForm, task: &task} }
		case "d":
			d.store.DeleteTask(d.task.ID)
			return d, func() tea.Msg { return stateMsg{state: viewList} }
		case "x", " ":
			d.task.Status = !d.task.Status
			d.store.UpdateTask(&d.task)
		case "esc":
			return d, func() tea.Msg { return stateMsg{state: viewList} }
		}
	}
	return d, nil
}

func (d detailModel) View(totalWidth int, lists []model.List) string {
	sidebarWidth := totalWidth / 4
	if sidebarWidth < 20 {
		sidebarWidth = 20
	}
	detailWidth := totalWidth - sidebarWidth - 2
	
	style := lipgloss.NewStyle().
		Width(detailWidth).
		Padding(1, 2)
	
	backHint := lipgloss.NewStyle().
		Foreground(lipgloss.AdaptiveColor{Light: "#808080", Dark: "#606060"}).
		Render("[Esc] Back")
	
	header := backHint + "\n" + lipgloss.NewStyle().
		Border(lipgloss.NormalBorder(), true, false, false, false).
		BorderForeground(lipgloss.AdaptiveColor{Light: "#D0D0D0", Dark: "#404040"}).
		Width(detailWidth).
		MarginTop(1).
		Render("") + "\n"
	
	title := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"}).Render(strings.ToUpper(d.task.Title))
	
	description := ""
	if d.task.Description != nil && *d.task.Description != "" {
		description = "\n" + lipgloss.NewStyle().Padding(1, 0).Render(*d.task.Description) + "\n"
	} else {
		description = "\n" + lipgloss.NewStyle().Italic(true).Foreground(lipgloss.AdaptiveColor{Light: "#808080", Dark: "#606060"}).Padding(1, 0).Render("No description provided.") + "\n"
	}
	
	listName := "None"
	listColor := "#808080"
	if d.task.ListID != nil {
		for _, l := range lists {
			if l.ID == *d.task.ListID {
				listName = l.Name
				listColor = l.Color
				break
			}
		}
	}
	
	priority := "None"
	prioColor := "#808080"
	if d.task.Priority != nil {
		priority = string(*d.task.Priority)
		switch *d.task.Priority {
		case model.PriorityHigh: prioColor = "#FF5F87"
		case model.PriorityMedium: prioColor = "#FFAF00"
		case model.PriorityLow: prioColor = "#5FD7FF"
		}
	}
	
	deadline := "No deadline"
	deadlineStyle := lipgloss.NewStyle()
	if d.task.Deadline != nil {
		deadline = d.task.Deadline.Format("January 02, 2006")
		if util.IsOverdue(d.task.Deadline, d.task.Status) {
			deadlineStyle = deadlineStyle.Foreground(lipgloss.Color("#FF5F00")).Bold(true)
		}
	}
	
	status := "○ Pending"
	statusStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#FFAF00"))
	if d.task.Status {
		status = "● Completed"
		statusStyle = statusStyle.Foreground(lipgloss.Color("#5FD787"))
	}
	
	labelStyle := lipgloss.NewStyle().Width(12).Bold(true).Foreground(lipgloss.AdaptiveColor{Light: "#555555", Dark: "#888888"})
	
	info := lipgloss.JoinVertical(lipgloss.Left,
		lipgloss.JoinHorizontal(lipgloss.Top, labelStyle.Render("LIST"), lipgloss.NewStyle().Foreground(lipgloss.Color(listColor)).Render(listName)),
		lipgloss.JoinHorizontal(lipgloss.Top, labelStyle.Render("PRIORITY"), lipgloss.NewStyle().Foreground(lipgloss.Color(prioColor)).Render(priority)),
		lipgloss.JoinHorizontal(lipgloss.Top, labelStyle.Render("DEADLINE"), deadlineStyle.Render(deadline)),
		lipgloss.JoinHorizontal(lipgloss.Top, labelStyle.Render("STATUS"), statusStyle.Render(status)),
		lipgloss.JoinHorizontal(lipgloss.Top, labelStyle.Render("CREATED"), lipgloss.NewStyle().Render(d.task.CreatedAt.Format("Jan 02, 2006"))),
	)
	
	return style.Render(header + title + "\n" + description + "\n" + info)
}
