package tui

import (
	"fmt"
	"strings"
	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/model"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/bubbles/textinput"
)

type sidebarModel struct {
	store    *db.SQLiteStore
	lists    []model.List
	cursor   int
	
	// For new list/rename
	inputMode bool
	renameMode bool
	textInput textinput.Model
}

func newSidebarModel(store *db.SQLiteStore) sidebarModel {
	ti := textinput.New()
	ti.Placeholder = "New list name..."
	ti.CharLimit = 20
	ti.Width = 15
	
	return sidebarModel{
		store:     store,
		textInput: ti,
	}
}

type fetchedListsMsg []model.List

func (s sidebarModel) fetchLists() tea.Cmd {
	return func() tea.Msg {
		lists, err := s.store.GetAllLists()
		if err != nil {
			return err
		}
		return fetchedListsMsg(lists)
	}
}

func (s sidebarModel) Init() tea.Cmd {
	return s.fetchLists()
}

func (s sidebarModel) Update(msg tea.Msg, isFocused bool, activeListID string, width int) (sidebarModel, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case fetchedListsMsg:
		s.lists = msg
		return s, nil

	case tea.KeyMsg:
		if s.inputMode {
			switch msg.String() {
			case "enter":
				name := s.textInput.Value()
				if name != "" {
					if s.renameMode {
						l := s.lists[s.cursor-1]
						l.Name = name
						err := s.store.UpdateList(&l)
						if err == nil {
							s.inputMode = false
							s.renameMode = false
							s.textInput.Blur()
							return s, s.fetchLists()
						}
					} else {
						err := s.store.CreateList(&model.List{Name: name, Color: "#FFFFFF"})
						if err == nil {
							s.inputMode = false
							s.textInput.Blur()
							return s, s.fetchLists()
						}
					}
				}
			case "esc":
				s.inputMode = false
				s.renameMode = false
				s.textInput.Blur()
				return s, nil
			}
			var cmd tea.Cmd
			s.textInput, cmd = s.textInput.Update(msg)
			return s, cmd
		}

		if isFocused {
			switch msg.String() {
			case "j":
				if s.cursor < len(s.lists) {
					s.cursor++
					return s, func() tea.Msg { return previewListMsg(s.getID()) }
				}
			case "k":
				if s.cursor > 0 {
					s.cursor--
					return s, func() tea.Msg { return previewListMsg(s.getID()) }
				}
			case "enter":
				return s, func() tea.Msg { return selectListMsg(s.getID()) }
			case "n":
				s.inputMode = true
				s.renameMode = false
				s.textInput.Placeholder = "New list name..."
				s.textInput.SetValue("")
				s.textInput.Focus()
				return s, textinput.Blink
			case "r":
				if s.cursor > 0 {
					s.inputMode = true
					s.renameMode = true
					s.textInput.Placeholder = "Rename list..."
					s.textInput.SetValue(s.lists[s.cursor-1].Name)
					s.textInput.Focus()
					return s, textinput.Blink
				}
			case "d":
				if s.cursor > 0 {
					l := s.lists[s.cursor-1]
					s.store.DeleteList(l.ID)
					return s, s.fetchLists()
				}
			}
		}
	}

	return s, tea.Batch(cmds...)
}

func (s sidebarModel) getID() string {
	if s.cursor == 0 {
		return "all"
	}
	if s.cursor > 0 && s.cursor <= len(s.lists) {
		return s.lists[s.cursor-1].ID
	}
	return "all"
}

func (s sidebarModel) View(isFocused bool, activeListID string, totalWidth int) string {
	sidebarWidth := totalWidth / 4
	if sidebarWidth < 20 {
		sidebarWidth = 20
	}
	
	style := lipgloss.NewStyle().
		Width(sidebarWidth).
		Padding(1, 1).
		Border(lipgloss.NormalBorder(), false, true, false, false).
		BorderForeground(lipgloss.AdaptiveColor{Light: "#D0D0D0", Dark: "#404040"})

	headerStyle := lipgloss.NewStyle().
		Foreground(lipgloss.AdaptiveColor{Light: "#808080", Dark: "#606060"}).
		Bold(true).
		Margin(1, 0, 1, 1)

	content := headerStyle.Render("GENERAL") + "\n"
	
	// All Tasks
	isActiveAll := activeListID == "all"
	isCursorAll := s.cursor == 0

	allTasksStyle := lipgloss.NewStyle().PaddingLeft(2)
	label := "  All Tasks"
	if isCursorAll {
		if isFocused {
			allTasksStyle = allTasksStyle.Background(lipgloss.AdaptiveColor{Light: "#EEEEEE", Dark: "#2A2A2A"}).Bold(true)
			label = "> All Tasks"
		} else {
			allTasksStyle = allTasksStyle.Background(lipgloss.AdaptiveColor{Light: "#F5F5F5", Dark: "#1F1F1F"})
			label = "> All Tasks"
		}
	} else if isActiveAll {
		allTasksStyle = allTasksStyle.Bold(true).Foreground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"})
	}
	content += allTasksStyle.Width(sidebarWidth - 2).Render(label) + "\n"
	
	content += "\n" + headerStyle.Render("MY LISTS") + "\n"
	
	for i, l := range s.lists {
		lineStyle := lipgloss.NewStyle().PaddingLeft(2)
		isActive := activeListID == l.ID
		isCursor := s.cursor == i+1

		label := l.Name
		count := fmt.Sprintf("%d", l.IncompleteCount)
		rowWidth := sidebarWidth - 4
		
		displayLabel := "  " + label
		if isCursor {
			if isFocused {
				lineStyle = lineStyle.Background(lipgloss.AdaptiveColor{Light: "#EEEEEE", Dark: "#2A2A2A"}).Bold(true)
				displayLabel = "> " + label
			} else {
				lineStyle = lineStyle.Background(lipgloss.AdaptiveColor{Light: "#F5F5F5", Dark: "#1F1F1F"})
				displayLabel = "> " + label
			}
		} else if isActive {
			lineStyle = lineStyle.Bold(true).Foreground(lipgloss.AdaptiveColor{Light: "#000000", Dark: "#FFFFFF"})
		}
		
		spacing := rowWidth - lipgloss.Width(displayLabel) - lipgloss.Width(count)
		item := displayLabel
		if spacing > 0 {
			item += strings.Repeat(" ", spacing) + lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#A0A0A0", Dark: "#505050"}).Render(count)
		}
		content += lineStyle.Width(sidebarWidth-2).Render(item) + "\n"
	}
	
	if s.inputMode {
		content += "\n  " + s.textInput.View()
	} else {
		content += "\n  " + lipgloss.NewStyle().Foreground(lipgloss.AdaptiveColor{Light: "#808080", Dark: "#606060"}).Render("+ new list")
	}

	return style.Render(content)
}
