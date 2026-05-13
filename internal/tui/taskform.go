package tui

import (
	"fmt"
	"strings"
	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/model"
	"github.com/0xSidBanerjee/tusk/internal/util"
	"github.com/charmbracelet/bubbles/textarea"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type formModel struct {
	store *db.SQLiteStore
	isEdit bool
	taskID string
	
	focusIndex int
	
	titleInput    textinput.Model
	descInput     textarea.Model
	deadlineInput textinput.Model
	
	activeList int
	activePrio int
	
	showListPicker bool
	showPrioPicker bool
	
	errorMsg string
	confirmSave bool
}

func newFormModel(store *db.SQLiteStore) formModel {
	title := textinput.New()
	title.Focus()
	
	desc := textarea.New()
	desc.SetHeight(5)
	
	deadline := textinput.New()
	
	return formModel{
		store:         store,
		titleInput:    title,
		descInput:     desc,
		deadlineInput: deadline,
	}
}

func (f *formModel) reset() {
	f.isEdit = false
	f.focusIndex = 0
	f.taskID = ""
	f.errorMsg = ""
	f.titleInput.SetValue("")
	f.descInput.SetValue("")
	f.deadlineInput.SetValue("")
	f.activeList = 0
	f.activePrio = 0
	f.titleInput.Focus()
	f.descInput.Blur()
	f.deadlineInput.Blur()
	f.showListPicker = false
	f.showPrioPicker = false
	f.confirmSave = false
}

func (f *formModel) loadTask(t model.Task) {
	f.reset()
	f.isEdit = true
	f.taskID = t.ID
	f.titleInput.SetValue(t.Title)
	if t.Description != nil {
		f.descInput.SetValue(*t.Description)
	}
	if t.Deadline != nil {
		f.deadlineInput.SetValue(t.Deadline.Format("2006-01-02"))
	}
}

func (f formModel) Init() tea.Cmd {
	return tea.Batch(textinput.Blink, textarea.Blink)
}

func (f formModel) Update(msg tea.Msg, totalWidth int, lists []model.List) (formModel, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		if f.showListPicker || f.showPrioPicker {
			switch msg.String() {
			case "j":
				if f.showListPicker {
					if f.activeList < len(lists) { f.activeList++ }
				} else {
					if f.activePrio < 3 { f.activePrio++ }
				}
			case "k":
				if f.showListPicker {
					if f.activeList > 0 { f.activeList-- }
				} else {
					if f.activePrio > 0 { f.activePrio-- }
				}
			case "enter", "esc":
				f.showListPicker = false
				f.showPrioPicker = false
			}
			return f, nil
		}

		switch msg.String() {
		case "tab":
			f.focusIndex = (f.focusIndex + 1) % 5
			f.updateFocus()
		case "shift+tab":
			f.focusIndex = (f.focusIndex - 1 + 5) % 5
			f.updateFocus()
		case "enter":
			if f.focusIndex == 2 {
				f.showListPicker = true
				return f, nil
			}
			if f.focusIndex == 3 {
				f.showPrioPicker = true
				return f, nil
			}
			if f.focusIndex != 1 {
				if !f.confirmSave {
					f.confirmSave = true
					return f, nil
				}
				return f.save(lists)
			}
		case "ctrl+s":
			if !f.confirmSave {
				f.confirmSave = true
				return f, nil
			}
			return f.save(lists)
		case "esc":
			return f, func() tea.Msg { return stateMsg{state: viewList} }
		}
	}

	var cmd tea.Cmd
	if f.focusIndex == 0 {
		f.titleInput, cmd = f.titleInput.Update(msg)
		cmds = append(cmds, cmd)
	} else if f.focusIndex == 1 {
		f.descInput, cmd = f.descInput.Update(msg)
		cmds = append(cmds, cmd)
	} else if f.focusIndex == 4 {
		f.deadlineInput, cmd = f.deadlineInput.Update(msg)
		cmds = append(cmds, cmd)
	}

	return f, tea.Batch(cmds...)
}

func (f *formModel) updateFocus() {
	f.titleInput.Blur()
	f.descInput.Blur()
	f.deadlineInput.Blur()
	
	switch f.focusIndex {
	case 0: f.titleInput.Focus()
	case 1: f.descInput.Focus()
	case 4: f.deadlineInput.Focus()
	}
}

func (f formModel) save(lists []model.List) (formModel, tea.Cmd) {
	title := f.titleInput.Value()
	if title == "" {
		f.errorMsg = "title is required"
		return f, nil
	}
	
	desc := f.descInput.Value()
	var description *string
	if desc != "" {
		description = &desc
	}
	
	deadlineStr := f.deadlineInput.Value()
	deadline, err := util.ParseDeadline(deadlineStr)
	if err != nil && deadlineStr != "" {
		f.errorMsg = "invalid deadline"
		return f, nil
	}
	
	var listID *string
	if f.activeList > 0 {
		id := lists[f.activeList-1].ID
		listID = &id
	}
	
	var priority *model.Priority
	if f.activePrio > 0 {
		var p model.Priority
		switch f.activePrio {
		case 1: p = model.PriorityHigh
		case 2: p = model.PriorityMedium
		case 3: p = model.PriorityLow
		}
		priority = &p
	}
	
	task := &model.Task{
		ID:          f.taskID,
		Title:       title,
		Description: description,
		ListID:      listID,
		Priority:    priority,
		Deadline:    deadline,
	}
	
	if f.isEdit {
		err = f.store.UpdateTask(task)
	} else {
		err = f.store.CreateTask(task)
	}
	
	if err != nil {
		f.errorMsg = err.Error()
		return f, nil
	}
	
	return f, func() tea.Msg { return stateMsg{state: viewList} }
}

func (f formModel) View(totalWidth int, lists []model.List) string {
	sidebarWidth := totalWidth / 4
	if sidebarWidth < 20 {
		sidebarWidth = 20
	}
	formWidth := totalWidth - sidebarWidth - 2
	
	style := lipgloss.NewStyle().Width(formWidth).Padding(1, 2)
	
	title := "New Task"
	if f.isEdit {
		title = "Edit Task"
	}
	
	backHint := lipgloss.NewStyle().
		Foreground(lipgloss.AdaptiveColor{Light: "#808080", Dark: "#606060"}).
		Render("󰜵 Cancel [Esc]")
	
	header := backHint + "\n" + lipgloss.NewStyle().
		Border(lipgloss.NormalBorder(), true, false, false, false).
		BorderForeground(lipgloss.AdaptiveColor{Light: "#D0D0D0", Dark: "#404040"}).
		Width(formWidth).
		MarginTop(1).
		Render("") + "\n"
	
	formTitle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#7D56F4")).Render(strings.ToUpper(title))
	
	content := header + formTitle + "\n\n"
	
	// Fields
	content += f.renderField("TITLE", f.titleInput.View(), f.focusIndex == 0)
	if f.errorMsg == "title is required" && f.focusIndex == 0 {
		content += lipgloss.NewStyle().Foreground(lipgloss.Color("#FF5F87")).Render("  󰀦 Title is required") + "\n"
	}
	
	content += "\n" + f.renderField("DESCRIPTION", f.descInput.View(), f.focusIndex == 1)
	
	// List Select
	listName := "Inbox"
	if f.activeList > 0 && f.activeList <= len(lists) {
		listName = lists[f.activeList-1].Name
	}
	content += "\n" + f.renderSelectField("LIST", listName, f.focusIndex == 2, f.showListPicker)
	if f.showListPicker {
		content += f.renderListPicker(lists)
	}
	
	// Priority Select
	prioName := "None"
	switch f.activePrio {
	case 1: prioName = "High"
	case 2: prioName = "Medium"
	case 3: prioName = "Low"
	}
	content += "\n" + f.renderSelectField("PRIORITY", prioName, f.focusIndex == 3, f.showPrioPicker)
	if f.showPrioPicker {
		content += f.renderPrioPicker()
	}
	
	content += "\n" + f.renderField("DEADLINE", f.deadlineInput.View(), f.focusIndex == 4)
	if f.errorMsg == "invalid deadline" && f.focusIndex == 4 {
		content += lipgloss.NewStyle().Foreground(lipgloss.Color("#FF5F87")).Render("  󰀦 Invalid deadline format (use YYYY-MM-DD, today, or tomorrow)") + "\n"
	}
	
	if f.confirmSave {
		action := "CREATE"
		if f.isEdit {
			action = "UPDATE"
		}
		content += "\n" + lipgloss.NewStyle().
			Foreground(lipgloss.Color("#FFFFFF")).
			Background(lipgloss.Color("#FF5F87")).
			Padding(0, 1).
			Bold(true).
			Render(fmt.Sprintf("  %s '%s'? PRESS ENTER AGAIN TO CONFIRM", action, strings.ToUpper(f.titleInput.Value())))
	}

	return style.Render(content)
}

func (f formModel) renderField(label, input string, isFocused bool) string {
	labelStyle := lipgloss.NewStyle().Bold(true)
	if isFocused {
		labelStyle = labelStyle.Foreground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"})
	}
	return labelStyle.Render(label) + "\n" + input + "\n"
}

func (f formModel) renderSelectField(label, value string, isFocused, isOpen bool) string {
	labelStyle := lipgloss.NewStyle().Bold(true).Width(10)
	if isFocused {
		labelStyle = labelStyle.Foreground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"})
	}
	
	valStyle := lipgloss.NewStyle().
		Border(lipgloss.NormalBorder()).
		Width(20).
		Padding(0, 1)
	
	if isFocused {
		valStyle = valStyle.BorderForeground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"})
	}
	
	return lipgloss.JoinHorizontal(lipgloss.Center, labelStyle.Render(label), valStyle.Render(value+"  ▼")) + "\n"
}

func (f formModel) renderListPicker(lists []model.List) string {
	style := lipgloss.NewStyle().MarginLeft(12).Border(lipgloss.NormalBorder()).Padding(0, 1)
	content := ""
	
	items := []string{"None"}
	for _, l := range lists {
		items = append(items, l.Name)
	}
	
	for i, item := range items {
		if i == f.activeList {
			content += lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"}).Bold(true).Render("> "+item) + "\n"
		} else {
			content += "  " + item + "\n"
		}
	}
	return style.Render(content)
}

func (f formModel) renderPrioPicker() string {
	style := lipgloss.NewStyle().MarginLeft(12).Border(lipgloss.NormalBorder()).Padding(0, 1)
	content := ""
	
	items := []string{"None", "High", "Medium", "Low"}
	for i, item := range items {
		if i == f.activePrio {
			content += lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"}).Bold(true).Render("> "+item) + "\n"
		} else {
			content += "  " + item + "\n"
		}
	}
	return style.Render(content)
}
