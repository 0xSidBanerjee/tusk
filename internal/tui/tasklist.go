package tui

import (
	"fmt"
	"strings"
	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/model"
	"github.com/0xSidBanerjee/tusk/internal/util"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type taskListModel struct {
	store  *db.SQLiteStore
	tasks  []model.Task
	cursor int
	total  int
	
	// Filtering
	priorityFilter *model.Priority
	statusFilter   *bool
	showFilterBar  bool
	
	// Confirmation
	confirmDelete bool
}

func newTaskListModel(store *db.SQLiteStore) taskListModel {
	return taskListModel{
		store: store,
	}
}

type fetchedTasksMsg struct {
	tasks []model.Task
	total int
}

func (t taskListModel) fetchTasks(listID string, priority *model.Priority, status *bool) tea.Cmd {
	return func() tea.Msg {
		filters := db.GetAllFilters{
			Page:     1,
			PageSize: 100,
		}
		if listID != "all" {
			filters.ListID = listID
		}
		filters.Priority = priority
		filters.Status = status

		tasks, total, err := t.store.GetAllTasks(filters)
		if err != nil {
			return err
		}
		return fetchedTasksMsg{tasks: tasks, total: total}
	}
}

func (t taskListModel) Init() tea.Cmd {
	return t.fetchTasks("all", nil, nil)
}

func (t taskListModel) Update(msg tea.Msg, isFocused bool, activeListID string, totalWidth int, lists []model.List) (taskListModel, tea.Cmd) {
	switch msg := msg.(type) {
	case fetchedTasksMsg:
		t.tasks = msg.tasks
		t.total = msg.total
		if t.cursor >= len(t.tasks) && len(t.tasks) > 0 {
			t.cursor = len(t.tasks) - 1
		}
		return t, nil

	case tea.KeyMsg:
		if t.showFilterBar {
			switch msg.String() {
			case "p":
				t.cyclePriorityFilter()
				return t, t.fetchTasks(activeListID, t.priorityFilter, t.statusFilter)
			case "s":
				t.cycleStatusFilter()
				return t, t.fetchTasks(activeListID, t.priorityFilter, t.statusFilter)
			case "c":
				t.priorityFilter = nil
				t.statusFilter = nil
				return t, t.fetchTasks(activeListID, t.priorityFilter, t.statusFilter)
			case "esc", "/":
				t.showFilterBar = false
				return t, nil
			}
			return t, nil
		}

		if t.confirmDelete {
			switch msg.String() {
			case "y":
				if len(t.tasks) > 0 {
					t.store.DeleteTask(t.tasks[t.cursor].ID)
					t.confirmDelete = false
					return t, t.fetchTasks(activeListID, t.priorityFilter, t.statusFilter)
				}
			case "n", "esc":
				t.confirmDelete = false
				return t, nil
			}
			return t, nil
		}

		if isFocused {
			switch msg.String() {
			case "j":
				if t.cursor < len(t.tasks)-1 {
					t.cursor++
				}
			case "k":
				if t.cursor > 0 {
					t.cursor--
				}
			case "g":
				t.cursor = 0
			case "G":
				if len(t.tasks) > 0 {
					t.cursor = len(t.tasks) - 1
				}
			case "x", " ":
				if len(t.tasks) > 0 {
					task := t.tasks[t.cursor]
					task.Status = !task.Status
					t.store.UpdateTask(&task)
					return t, t.fetchTasks(activeListID, t.priorityFilter, t.statusFilter)
				}
			case "enter", "o":
				if len(t.tasks) > 0 {
					task := t.tasks[t.cursor]
					return t, func() tea.Msg { return stateMsg{state: viewDetail, task: &task} }
				}
			case "n":
				return t, func() tea.Msg { return stateMsg{state: viewForm, task: nil} }
			case "e":
				if len(t.tasks) > 0 {
					task := t.tasks[t.cursor]
					return t, func() tea.Msg { return stateMsg{state: viewForm, task: &task} }
				}
			case "d":
				if len(t.tasks) > 0 {
					t.confirmDelete = true
					return t, nil
				}
			case "/":
				t.showFilterBar = true
				return t, nil
			}
		}
	}

	return t, nil
}

func (t *taskListModel) cyclePriorityFilter() {
	if t.priorityFilter == nil {
		hp := model.PriorityHigh
		t.priorityFilter = &hp
	} else if *t.priorityFilter == model.PriorityHigh {
		mp := model.PriorityMedium
		t.priorityFilter = &mp
	} else if *t.priorityFilter == model.PriorityMedium {
		lp := model.PriorityLow
		t.priorityFilter = &lp
	} else {
		t.priorityFilter = nil
	}
}

func (t *taskListModel) cycleStatusFilter() {
	if t.statusFilter == nil {
		pending := false
		t.statusFilter = &pending
	} else if *t.statusFilter == false {
		done := true
		t.statusFilter = &done
	} else {
		t.statusFilter = nil
	}
}

func (t taskListModel) View(isFocused bool, activeListID string, totalWidth int, lists []model.List) string {
	sidebarWidth := totalWidth / 4
	if sidebarWidth < 20 {
		sidebarWidth = 20
	}
	taskListWidth := totalWidth - sidebarWidth - 2
	
	style := lipgloss.NewStyle().
		Width(taskListWidth).
		Padding(1, 2)
	
	if isFocused {
		style = style.BorderForeground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"})
	}

	// Header
	listName := "All Tasks"
	if activeListID != "all" {
		for _, l := range lists {
			if l.ID == activeListID {
				listName = l.Name
				break
			}
		}
	}
	
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"}).
		Padding(0, 1)
	
	content := titleStyle.Render(strings.ToUpper(listName)) + "\n" + 
		lipgloss.NewStyle().
			Border(lipgloss.NormalBorder(), true, false, false, false).
			BorderForeground(lipgloss.AdaptiveColor{Light: "#D0D0D0", Dark: "#404040"}).
			Width(taskListWidth - 4).
			MarginTop(1).
			Render("") + "\n"
	
	if len(t.tasks) == 0 {
		content += "\n  " + lipgloss.NewStyle().Italic(true).Foreground(lipgloss.Color("#808080")).Render("No tasks here. [n] new task")
	} else {
		innerListWidth := taskListWidth - 4
		
		// Separate incomplete and completed
		var incomplete, completed []int
		for i, task := range t.tasks {
			if task.Status {
				completed = append(completed, i)
			} else {
				incomplete = append(incomplete, i)
			}
		}

		for _, idx := range incomplete {
			line := t.renderTaskLine(t.tasks[idx], idx == t.cursor, isFocused, innerListWidth, activeListID, lists)
			content += line + "\n"
		}

		if len(completed) > 0 {
			separator := lipgloss.NewStyle().
				Foreground(lipgloss.AdaptiveColor{Light: "#A0A0A0", Dark: "#505050"}).
				Margin(1, 0).
				Render(fmt.Sprintf("── Completed (%d) ──", len(completed)))
			content += separator + "\n"
			
			for _, idx := range completed {
				line := t.renderTaskLine(t.tasks[idx], idx == t.cursor, isFocused, innerListWidth, activeListID, lists)
				content += line + "\n"
			}
		}
	}
	
	if t.showFilterBar {
		content += "\n" + t.renderFilterBar(taskListWidth-4)
	}
	
	if t.confirmDelete && len(t.tasks) > 0 {
		taskName := t.tasks[t.cursor].Title
		content += "\n" + lipgloss.NewStyle().Foreground(lipgloss.Color("#FF5F87")).Bold(true).Render(fmt.Sprintf("  Delete '%s'? [y/n]", taskName))
	}

	return style.Render(content)
}

func (t taskListModel) renderTaskLine(task model.Task, isSelected bool, isFocused bool, width int, activeListID string, lists []model.List) string {
	indicator := "○" // Pending
	if task.Status {
		indicator = "●" // Done
	}
	
	prioColor := "#808080"
	if task.Priority != nil {
		switch *task.Priority {
		case model.PriorityHigh: prioColor = "#FF5F87"
		case model.PriorityMedium: prioColor = "#FFAF00"
		case model.PriorityLow: prioColor = "#5FD7FF"
		}
	}
	prioIndicator := lipgloss.NewStyle().Foreground(lipgloss.Color(prioColor)).Render("●")

	title := task.Title
	titleStyle := lipgloss.NewStyle().PaddingLeft(1)
	if task.Status {
		titleStyle = titleStyle.Strikethrough(true).Foreground(lipgloss.AdaptiveColor{Light: "#A0A0A0", Dark: "#606060"})
	} else {
		titleStyle = titleStyle.Foreground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"})
	}
	
	rowStyle := lipgloss.NewStyle().Width(width)
	
	cursorIndicator := "  "
	if isSelected && isFocused {
		cursorIndicator = lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"}).Bold(true).Render("> ")
		rowStyle = rowStyle.Background(lipgloss.AdaptiveColor{Light: "#EEEEEE", Dark: "#2A2A2A"}).Bold(true)
	} else if isSelected {
		cursorIndicator = "> "
		rowStyle = rowStyle.Background(lipgloss.AdaptiveColor{Light: "#F5F5F5", Dark: "#1F1F1F"})
	}
	
	// List badge immediately after title
	badge := ""
	if activeListID == "all" && task.ListID != nil {
		for _, l := range lists {
			if l.ID == *task.ListID {
				badge = lipgloss.NewStyle().
					Foreground(lipgloss.Color(l.Color)).
					Italic(true).
					Faint(true).
					MarginLeft(1).
					Render(fmt.Sprintf("(%s)", l.Name))
				break
			}
		}
	}
	
	deadline := ""
	if task.Deadline != nil {
		deadline = task.Deadline.Format("Jan 02")
		deadlineStyle := lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#808080", Dark: "#808080"})
		if util.IsOverdue(task.Deadline, task.Status) {
			deadlineStyle = deadlineStyle.Foreground(lipgloss.Color("#FF5F00")).Bold(true)
		}
		deadline = deadlineStyle.Render(deadline)
	}
	
	prefix := cursorIndicator + indicator + " " + prioIndicator
	mainText := prefix + titleStyle.Render(title) + badge
	
	// Available width inside the row (width - 2 for padding)
	availWidth := width - 2
	
	// Right side info (just deadline)
	spacing := availWidth - lipgloss.Width(mainText) - lipgloss.Width(deadline)
	if spacing > 0 {
		mainText += strings.Repeat(" ", spacing)
	}
	
	return rowStyle.Render(mainText + deadline)
}

func (t taskListModel) renderFilterBar(width int) string {
	pFilter := "All"
	if t.priorityFilter != nil {
		pFilter = string(*t.priorityFilter)
	}
	
	sFilter := "All"
	if t.statusFilter != nil {
		if *t.statusFilter {
			sFilter = "Done"
		} else {
			sFilter = "Pending"
		}
	}
	
	return lipgloss.NewStyle().
		Border(lipgloss.NormalBorder(), true, false, false, false).
		Width(width).
		Render(fmt.Sprintf("  Filter: Priority [%s]  Status [%s]  [c] clear", pFilter, sFilter))
}
