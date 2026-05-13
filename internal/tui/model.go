package tui

import (
	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/model"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type viewState int

const (
	viewList viewState = iota
	viewDetail
	viewForm
)

type focusArea int

const (
	focusSidebar focusArea = iota
	focusTaskList
)

// Messages for state transitions
type stateMsg struct {
	state viewState
	task  *model.Task
}

type focusMsg focusArea

type previewListMsg string

type selectListMsg string

type Model struct {
	store    *db.SQLiteStore
	width    int
	height   int
	
	state    viewState
	focus    focusArea
	
	sidebar  sidebarModel
	taskList taskListModel
	detail   detailModel
	form     formModel
	help     helpModel
	
	showHelp bool
	
	activeListID string // "all" for All Tasks
}

func NewModel(store *db.SQLiteStore) Model {
	m := Model{
		store:        store,
		state:        viewList,
		focus:        focusTaskList,
		activeListID: "all",
	}
	
	m.sidebar = newSidebarModel(store)
	m.taskList = newTaskListModel(store)
	m.detail = newDetailModel(store)
	m.form = newFormModel(store)
	m.help = newHelpModel()
	
	return m
}

func (m Model) Init() tea.Cmd {
	return tea.Batch(
		m.sidebar.Init(),
		m.taskList.fetchTasks("all", nil, nil),
	)
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		if m.showHelp {
			switch msg.String() {
			case "esc", "?":
				m.showHelp = false
				return m, nil
			}
		}

		if m.state == viewForm {
			// Form handles its own keys
		} else {
			switch msg.String() {
			case "q":
				return m, tea.Quit
			case "?":
				m.showHelp = true
				return m, nil
			case "tab":
				if m.state == viewList {
					if m.focus == focusSidebar {
						m.focus = focusTaskList
					} else {
						m.focus = focusSidebar
					}
				}
			case "h", "left":
				if m.state == viewList && m.focus == focusTaskList {
					m.focus = focusSidebar
					return m, nil
				}
			case "l", "right":
				if m.state == viewList && m.focus == focusSidebar {
					m.focus = focusTaskList
					return m, nil
				}
			case "esc":
				if m.state == viewDetail || m.state == viewForm {
					m.state = viewList
					return m, m.taskList.fetchTasks(m.activeListID, m.taskList.priorityFilter, m.taskList.statusFilter)
				}
			}
		}

	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height

	case stateMsg:
		m.state = msg.state
		if msg.task != nil {
			if m.state == viewDetail {
				m.detail.task = *msg.task
			} else if m.state == viewForm {
				m.form.loadTask(*msg.task, m.sidebar.lists)
			}
		} else if m.state == viewForm {
			m.form.reset(m.activeListID, m.sidebar.lists)
		}
		
		if m.state == viewList {
			return m, tea.Batch(
				m.taskList.fetchTasks(m.activeListID, m.taskList.priorityFilter, m.taskList.statusFilter),
				m.sidebar.fetchLists(),
			)
		}
		return m, nil

	case fetchedTasksMsg:
		cmds = append(cmds, m.sidebar.fetchLists())

	case previewListMsg:
		m.activeListID = string(msg)
		return m, m.taskList.fetchTasks(m.activeListID, m.taskList.priorityFilter, m.taskList.statusFilter)

	case selectListMsg:
		m.activeListID = string(msg)
		m.focus = focusTaskList
		return m, m.taskList.fetchTasks(m.activeListID, m.taskList.priorityFilter, m.taskList.statusFilter)

	case focusMsg:
		m.focus = focusArea(msg)
		return m, nil
	}

	// Delegate updates
	if m.showHelp {
		var hCmd tea.Cmd
		m.help, hCmd = m.help.Update(msg)
		cmds = append(cmds, hCmd)
	} else {
		switch m.state {
		case viewList:
			var sCmd, tCmd tea.Cmd
			m.sidebar, sCmd = m.sidebar.Update(msg, m.focus == focusSidebar, m.activeListID, m.width)
			cmds = append(cmds, sCmd)

			m.taskList, tCmd = m.taskList.Update(msg, m.focus == focusTaskList, m.activeListID, m.width, m.sidebar.lists)
			cmds = append(cmds, tCmd)
		case viewDetail:
			var dCmd tea.Cmd
			m.detail, dCmd = m.detail.Update(msg, m.width)
			cmds = append(cmds, dCmd)
		case viewForm:
			var fCmd tea.Cmd
			m.form, fCmd = m.form.Update(msg, m.width, m.sidebar.lists)
			cmds = append(cmds, fCmd)
		}
	}

	return m, tea.Batch(cmds...)
}

func (m Model) View() string {
	if m.width == 0 || m.height == 0 {
		return "Initializing..."
	}

	// Adjust widths for global frame (borders + padding)
	usableWidth := m.width - 4
	
	sidebarWidth := usableWidth / 4
	if sidebarWidth < 20 {
		sidebarWidth = 20
	}
	
	// Layout components
	header := m.renderHeader(usableWidth)
	footer := m.renderFooter(usableWidth)
	
	var mainView string
	if m.state == viewForm {
		mainView = m.form.View(usableWidth, m.sidebar.lists)
	} else if m.state == viewDetail {
		sidebar := m.sidebar.View(false, m.activeListID, usableWidth)
		detail := m.detail.View(usableWidth, m.sidebar.lists)
		mainView = lipgloss.JoinHorizontal(lipgloss.Top, sidebar, detail)
	} else {
		sidebar := m.sidebar.View(m.focus == focusSidebar, m.activeListID, usableWidth)
		taskList := m.taskList.View(m.focus == focusTaskList, m.activeListID, usableWidth, m.sidebar.lists)
		mainView = lipgloss.JoinHorizontal(lipgloss.Top, sidebar, taskList)
	}

	fullView := lipgloss.JoinVertical(lipgloss.Left, header, mainView, footer)
	
	finalStyle := lipgloss.NewStyle().
		Border(lipgloss.NormalBorder()).
		BorderForeground(lipgloss.AdaptiveColor{Light: "#D0D0D0", Dark: "#404040"}).
		Padding(0, 1)
	
	if m.showHelp {
		return m.help.View(m.width, m.height)
	}
	
	return finalStyle.Render(fullView)
}

func (m *Model) renderHeader(width int) string {
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"}).
		Background(lipgloss.AdaptiveColor{Light: "#D0D0D0", Dark: "#333333"}).
		Padding(0, 2)
	
	helpHintStyle := lipgloss.NewStyle().
		Foreground(lipgloss.AdaptiveColor{Light: "#808080", Dark: "#606060"}).
		Padding(0, 1)
	
	title := titleStyle.Render("TUSK")
	helpHint := helpHintStyle.Render("Press [?] for help")
	
	space := lipgloss.NewStyle().Width(width - lipgloss.Width(title) - lipgloss.Width(helpHint)).Render("")
	
	header := lipgloss.JoinHorizontal(lipgloss.Top, title, space, helpHint)
	return lipgloss.NewStyle().
		Border(lipgloss.NormalBorder(), false, false, true, false).
		BorderForeground(lipgloss.AdaptiveColor{Light: "#D0D0D0", Dark: "#404040"}).
		Width(width).
		Render(header)
}

func (m *Model) renderFooter(width int) string {
	statusStyle := lipgloss.NewStyle().
		Foreground(lipgloss.AdaptiveColor{Light: "#808080", Dark: "#808080"}).
		Width(width).
		Padding(0, 1)
	
	var hint string
	if m.state == viewForm {
		hint = "[Enter] save  [Esc] cancel  [Tab] next"
	} else if m.state == viewDetail {
		hint = "[e] edit  [d] delete  [x] toggle  [Esc] back"
	} else {
		if m.focus == focusSidebar {
			hint = "[j/k] navigate  [Enter] select  [n] new list  [d] delete"
		} else {
			hint = "[j/k] navigate  [Enter] open  [n] new task  [e] edit  [d] delete  [x] toggle  [/] filter"
		}
	}
	
	return statusStyle.Render(" " + hint)
}


