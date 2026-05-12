# Tusk

A minimalist, single-binary todo web application built with **Go** and **React**. Tusk mirrors the simplicity of a classic todo list while providing a powerful CLI and a functional web interface.

## Features

- **Single Binary Deployment** — Go backend, SQLite database, and React frontend are all embedded into a single executable.
- **Natural Language Entry** — Create tasks using a simple pipe-delimited syntax: `Title | Priority | Deadline`.
- **Light & Dark Mode** — Clean, responsive web interface with support for multiple themes.
- **Data Portability** — Import and export tasks in JSON, CSV, YAML, and TOML formats.
- **Developer Ready** — Automated CI/CD with GitHub Actions and GoReleaser.

## Installation

Ensure you have **Go 1.22+** and **Node.js 20+** installed.

```bash
git clone https://github.com/0xSidBanerjee/tusk.git
cd tusk
make build
./tusk --help
```

## Usage

### Launch the Web App
```bash
./tusk serve
```

### Import Data
```bash
./tusk import --format JSON --input-file tasks.json
```

### Export Data
```bash
./tusk export --format YAML --export-path ./backups/
```

## CLI Reference

### Global Flags
| Flag | Description | Default |
| --- | --- | --- |
| `-d, --db-file` | Path to the SQLite database file | `todo.db` |
| `-h, --help` | Display help information | - |

### `serve` Command
Serves the web application and REST API.

| Flag | Description | Default |
| --- | --- | --- |
| `-b, --address` | The IP address to bind to | `localhost` |
| `-p, --port` | The port to listen on | `8080` |
| `-o, --open-browser` | Automatically open the app in the browser | `true` |

### `export` Command
Exports the todo list to common formats.

| Flag | Description | Default |
| --- | --- | --- |
| `-f, --format` | Export format (CSV, JSON, YAML, TOML) | `CSV` |
| `-l, --export-path` | Output location or filename | `.` |

### `import` Command
Imports tasks and lists from a file.

| Flag | Description | Default |
| --- | --- | --- |
| `-f, --format` | Input format (CSV, JSON, YAML, TOML) | `JSON` |
| `-i, --input-file` | Path to the file to import | - |

## Development

Tusk uses a `Makefile` for common development tasks:

| Target | Description |
| --- | --- |
| `make deps` | Install backend and frontend dependencies |
| `make lint` | Run static analysis (Go vet & ESLint) |
| `make fmt` | Format all source files |
| `make test` | Execute the full test suite |
| `make build` | Build the optimized single-binary executable |
| `make clean` | Remove all build and temporary artifacts |

## Tech Stack

- **Backend**: Go, Gin, SQLite, Cobra.
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, TanStack Query.
- **Release**: GitHub Actions, GoReleaser.

## License
MIT
