/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"

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
		fmt.Printf("Starting server on %s:%d\n", address, port)
		fmt.Printf("Database file: %s\n", dbFile)
		fmt.Printf("Open browser: %v\n", openBrowser)
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)

	serveCmd.Flags().StringVarP(&dbFile, "db-file", "d", "todo.db", "The path to sqlite database file to use")
	serveCmd.Flags().StringVarP(&address, "address", "b", "localhost", "The ip address to bind to")
	serveCmd.Flags().IntVarP(&port, "port", "p", 8080, "The port to listen on")
	serveCmd.Flags().BoolVarP(&openBrowser, "open-browser", "o", true, "Specify if app automatically opens in browser")
}
