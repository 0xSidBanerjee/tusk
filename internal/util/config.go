package util

import (
	"os"
	"path/filepath"
	"runtime"
)

// GetDefaultDBPath returns the platform-specific default path for the Tusk database.
// Linux: $XDG_DATA_HOME/tusk/tusk.db (defaults to ~/.local/share/tusk/tusk.db)
// macOS: ~/Library/Application Support/tusk/tusk.db
// Windows: %APPDATA%\tusk\tusk.db
func GetDefaultDBPath() string {
	var baseDir string
	var err error

	switch runtime.GOOS {
	case "linux":
		// XDG_DATA_HOME is preferred for databases on Linux
		baseDir = os.Getenv("XDG_DATA_HOME")
		if baseDir == "" {
			home, err := os.UserHomeDir()
			if err == nil {
				baseDir = filepath.Join(home, ".local", "share")
			}
		}
	case "darwin":
		// macOS uses ~/Library/Application Support for app data
		baseDir, err = os.UserConfigDir()
	case "windows":
		// Windows uses %APPDATA% (Roaming)
		baseDir, err = os.UserConfigDir()
	default:
		// Fallback for other platforms
		return "tusk.db"
	}

	if err != nil || baseDir == "" {
		return "tusk.db"
	}

	return filepath.Join(baseDir, "tusk", "tusk.db")
}
