/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/model"
	"github.com/0xSidBanerjee/tusk/internal/util"
	"github.com/charmbracelet/lipgloss"
	"github.com/spf13/cobra"
)

var (
	priorityFlag string
	statusFlag   string
	deadlineFlag string
)

// listCmd represents the list command
var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List tasks with filters and sorting",
	Long: `List tasks from your database with powerful filtering and sorting.
By default, it shows pending tasks across all priorities, 
sorted exactly as shown in the web UI.

Flags:
  --priority   Filter by priority (high, medium, low, all)
  --status     Filter by status (pending, completed, all)
  --deadline   Filter by deadline (today, overdue, this-week, all)

Examples:
  tusk list
  tusk list --status all
  tusk list --priority high --deadline today
  tusk list --deadline overdue`,
	Run: func(cmd *cobra.Command, args []string) {
		database, err := db.InitDB(dbFile)
		if err != nil {
			fmt.Printf("Error initializing database: %v\n", err)
			os.Exit(1)
		}
		defer database.Close()

		store := db.NewSQLiteStore(database)
		filters := db.GetAllFilters{
			Page:     1,
			PageSize: 1000,
		}

		// Status Filter (Default: pending)
		if statusFlag != "" && strings.ToLower(statusFlag) != "all" {
			var s bool
			switch strings.ToLower(statusFlag) {
			case "pending":
				s = false
			case "completed", "done":
				s = true
			default:
				fmt.Printf("Error: invalid status '%s'\n", statusFlag)
				os.Exit(1)
			}
			filters.Status = &s
		}

		// Priority Filter (Default: all)
		if priorityFlag != "" && strings.ToLower(priorityFlag) != "all" {
			p := util.ParsePriority(priorityFlag)
			if p == nil {
				fmt.Printf("Error: invalid priority '%s'\n", priorityFlag)
				os.Exit(1)
			}
			filters.Priority = p
		}

		// Deadline Filter (Default: all)
		if deadlineFlag != "" && strings.ToLower(deadlineFlag) != "all" {
			d := db.DeadlineFilter(strings.ToLower(deadlineFlag))
			switch d {
			case db.DeadlineToday, db.DeadlineOverdue, db.DeadlineThisWeek:
				filters.Deadline = &d
			default:
				fmt.Printf("Error: invalid deadline filter '%s'\n", deadlineFlag)
				os.Exit(1)
			}
		}

		tasks, _, err := store.GetAllTasks(filters)
		if err != nil {
			fmt.Printf("Error fetching tasks: %v\n", err)
			os.Exit(1)
		}

		if len(tasks) == 0 {
			fmt.Println("No tasks found.")
			return
		}

		renderTasks(tasks)
	},
}

func init() {
	rootCmd.AddCommand(listCmd)

	listCmd.Flags().StringVarP(&priorityFlag, "priority", "p", "all", "Filter by priority (high, medium, low, all)")
	listCmd.Flags().StringVarP(&statusFlag, "status", "s", "pending", "Filter by status (pending, completed, all)")
	listCmd.Flags().StringVar(&deadlineFlag, "deadline", "all", "Filter by deadline (today, overdue, this-week, all)")
}

func renderTasks(tasks []model.Task) {
	for _, task := range tasks {
		indicator := "○"
		if task.Status {
			indicator = "●"
		}

		prioIndicator := " "
		prioColor := "#808080"
		if task.Priority != nil {
			prioIndicator = "●"
			switch *task.Priority {
			case model.PriorityHigh:
				prioColor = "#FF5F87"
			case model.PriorityMedium:
				prioColor = "#FFAF00"
			case model.PriorityLow:
				prioColor = "#5FD7FF"
			}
		}
		prioStyle := lipgloss.NewStyle().Foreground(lipgloss.Color(prioColor))

		titleStyle := lipgloss.NewStyle().PaddingLeft(1)
		if task.Status {
			titleStyle = titleStyle.Strikethrough(true).Foreground(lipgloss.Color("#606060"))
		} else {
			titleStyle = titleStyle.Foreground(lipgloss.Color("#FFFFFF"))
		}

		deadline := ""
		if task.Deadline != nil {
			deadlineStr := util.FormatDeadline(task.Deadline)
			deadlineStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#808080")).MarginLeft(2)
			if util.IsOverdue(task.Deadline, task.Status) {
				deadlineStyle = deadlineStyle.Foreground(lipgloss.Color("#FF5F00")).Bold(true)
			}
			deadline = deadlineStyle.Render(deadlineStr)
		}

		line := fmt.Sprintf("%s %s %s%s", 
			indicator, 
			prioStyle.Render(prioIndicator), 
			titleStyle.Render(task.Title), 
			deadline,
		)
		fmt.Println(line)
	}
}

