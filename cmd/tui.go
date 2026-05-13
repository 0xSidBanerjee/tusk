package cmd

import (
	"fmt"
	"os"

	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/tui"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/spf13/cobra"
)

// tuiCmd represents the tui command
var tuiCmd = &cobra.Command{
	Use:   "tui",
	Short: "Open the interactive TUI",
	Long:  "Open the Tusk terminal UI to manage tasks and lists interactively.",
	Run: func(cmd *cobra.Command, args []string) {
		database, err := db.InitDB(dbFile)
		if err != nil {
			fmt.Printf("Error: failed to initialize database: %v\n", err)
			os.Exit(1)
		}
		defer database.Close()

		store := db.NewSQLiteStore(database)
		
		p := tea.NewProgram(tui.NewModel(store), tea.WithAltScreen())
		if _, err := p.Run(); err != nil {
			fmt.Printf("Error: TUI failed: %v\n", err)
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.AddCommand(tuiCmd)
}
