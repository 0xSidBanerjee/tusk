package tui

import (
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type helpModel struct{}

func newHelpModel() helpModel {
	return helpModel{}
}

func (h helpModel) Init() tea.Cmd { return nil }

func (h helpModel) Update(msg tea.Msg) (helpModel, tea.Cmd) {
	return h, nil
}

func (h helpModel) View(width, height int) string {
	style := lipgloss.NewStyle().
		Border(lipgloss.DoubleBorder()).
		BorderForeground(lipgloss.Color("#7D56F4")).
		Padding(1, 4).
		Background(lipgloss.AdaptiveColor{Light: "#FFFFFF", Dark: "#1A1A1A"})

	title := lipgloss.NewStyle().Bold(true).Underline(true).Render("KEYBINDINGS")
	
	content := "\n" + lipgloss.JoinHorizontal(lipgloss.Top,
		h.renderSection("Global", []string{
			"q       Quit",
			"?       Toggle help",
			"Tab     Switch panel",
			"/       Filter mode",
			"Esc     Back/Cancel",
		}),
		"    ",
		h.renderSection("Sidebar", []string{
			"j/k     Navigate lists",
			"Enter   Select list",
			"n       New list",
			"r       Rename list",
			"d       Delete list",
		}),
		"    ",
		h.renderSection("Task List", []string{
			"j/k     Navigate tasks",
			"Enter/o Open task",
			"n       New task",
			"e       Edit task",
			"d       Delete task",
			"x/Space Toggle status",
			"g/G     Top/Bottom",
		}),
	)

	helpBox := style.Render(title + content)
	
	return lipgloss.Place(width, height, lipgloss.Center, lipgloss.Center, helpBox)
}

func (h helpModel) renderSection(title string, bindings []string) string {
	sectionTitle := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#7D56F4")).Render(title)
	content := ""
	for _, b := range bindings {
		content += b + "\n"
	}
	return sectionTitle + "\n" + content
}
