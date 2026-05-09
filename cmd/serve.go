/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"
	"log/slog"

	"github.com/0xSidBanerjee/tusk/internal/api"
	"github.com/0xSidBanerjee/tusk/internal/db"
	"github.com/0xSidBanerjee/tusk/internal/util"
	"github.com/0xSidBanerjee/tusk/web"
	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
)

var (
	dbFile      string
	address     string
	port        int
	openBrowser bool
)

// serveCmd represents the serve command
var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the todo web application",
	Run: func(cmd *cobra.Command, args []string) {
		slog.Info("initializing database", "file", dbFile)
		database, err := db.InitDB(dbFile)
		if err != nil {
			slog.Error("failed to initialize database", "error", err)
			return
		}
		defer database.Close()

		store := db.NewSQLiteStore(database)
		handler := api.NewHandler(store)

		gin.SetMode(gin.ReleaseMode)
		router := gin.New()
		handler.RegisterRoutes(router, web.GetAssets())

		url := fmt.Sprintf("http://%s:%d", address, port)
		slog.Info("starting server", "url", url)

		if openBrowser {
			go func() {
				slog.Info("opening browser", "url", url)
				if err := util.OpenBrowser(url); err != nil {
					slog.Warn("failed to open browser", "error", err)
				}
			}()
		}

		if err := router.Run(fmt.Sprintf("%s:%d", address, port)); err != nil {
			slog.Error("server failed", "error", err)
		}
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)

	serveCmd.Flags().StringVarP(&dbFile, "db-file", "d", "todo.db", "The path to sqlite database file to use")
	serveCmd.Flags().StringVarP(&address, "address", "b", "localhost", "The ip address to bind to")
	serveCmd.Flags().IntVarP(&port, "port", "p", 8080, "The port to listen on")
	serveCmd.Flags().BoolVarP(&openBrowser, "open-browser", "o", true, "Specify if app automatically opens in browser")
}
