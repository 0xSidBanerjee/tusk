# Tusk

A single-binary task manager with a Web interface, TUI, and CLI.

## Quick Start

No install required:

```bash
docker run -p 8080:8080 -v tusk-data:/home/nonroot/.local/share/tusk ghcr.io/0xsidbaner/tusk
```

Then open http://localhost:8080.

## Features

- **Single Binary**: Backend, frontend, and database (SQLite) are embedded into one executable.
- **TUI**: Interactive terminal interface with live list navigation.
- **Web UI**: Responsive web application with light/dark theme support.
- **CLI**: Commands for importing/exporting tasks (JSON, CSV, YAML, TOML).
- **Organization**: Support for custom lists and priority levels.
- **Zero Dependencies**: Runs as a standalone binary on Linux, macOS, and Windows.

## Installation

### From Source
```bash
git clone https://github.com/0xSidBanerjee/tusk.git
cd tusk
make build
./tusk --help
```

## Usage

### Terminal UI (TUI)
```bash
./tusk tui
```

### Web Interface
```bash
./tusk serve -p 8080
```

### Data Portability
```bash
# Export
./tusk export --format json --export-path backup.json

# Import
./tusk import --format csv --input-file tasks.csv
```

### Quick Add & List
```bash
# Add a task with quick-add syntax
./tusk add "Fix login bug | high | tomorrow"

# List pending tasks
./tusk list

# List completed tasks
./tusk list --status completed
```

## CLI Reference

### Global Flags
- `-d, --db-file`: Path to the SQLite database. Defaults to platform-standard locations (XDG on Linux, Application Support on macOS, AppData on Windows).

### `tui`
Interactive terminal interface.
- `j/k`: Navigate tasks/lists
- `enter`: Open/Select
- `n`: New task
- `d`: Delete task
- `x`: Toggle status
- `?`: Help

### `add`
Add a task using quick-add syntax.
- Syntax: `"Title | Priority | Deadline"`
- Example: `./tusk add "Buy coffee | high | today"`

### `list`
List tasks with filters and sorting.
- `--priority`: Filter by priority (high, medium, low)
- `--status`: Filter by status (pending, completed, all)
- `--deadline`: Filter by deadline (today, overdue, this-week)
- Example: `./tusk list --priority high --deadline today`

### `serve`
Start the web server and API.
- `-b, --address`: Bind address (default: `localhost`)
- `-p, --port`: Listen port (default: `8080`)
- `-o, --open-browser`: Auto-open browser (default: `true`)

### `export`
- `-f, --format`: CSV, JSON, YAML, TOML
- `-l, --export-path`: Output file or directory

### `import`
- `-f, --format`: CSV, JSON, YAML, TOML
- `-i, --input-file`: Input file path

## Development

Requires Go 1.22+ and Node.js 20+.

```bash
make deps    # Install dependencies
make lint    # Run linters
make test    # Run tests
make build   # Build binary
```

## Tech Stack

- **Backend**: Go, Gin, SQLite, Cobra, Bubbletea
- **Frontend**: React, Vite, Tailwind CSS
- **Release**: GoReleaser

## License
MIT
