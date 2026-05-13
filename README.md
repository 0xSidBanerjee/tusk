# Tusk

A single-binary task manager with a Web interface, TUI, and CLI.

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

## CLI Reference

### `tui`
Interactive terminal interface.
- `j/k`: Navigate tasks/lists
- `enter`: Open/Select
- `n`: New task
- `d`: Delete task
- `x`: Toggle status
- `?`: Help

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
