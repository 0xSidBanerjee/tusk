# Tusk

A minimalist, single-binary todo web application built with **Go** and **React**. Tusk mirrors the simplicity of a classic todo list while providing a powerful CLI and a calm, functional web interface.

> Single binary, zero external dependencies (except SQLite), and ready for your workflow.

- **Fast & Lightweight** — Built with Go and React, served from a single binary using `go:embed`.
- **Persistent Storage** — Local SQLite database with WAL mode enabled for high performance.
- **Modern Web Interface** — A calm, functional UI with Light/Dark mode support and responsive design.
- **Powerful CLI** — Command-line interface for serving the web app or exporting your tasks.
- **Export Everywhere** — Export your todo list to JSON, CSV, YAML, or TOML formats.
- **Developer Ready** — Clean Makefile, CI/CD with GitHub Actions, and cross-platform releases via GoReleaser.

---

## Installation

### Build from source
Tusk is written in Go and requires Go 1.22+ and Node.js 20+ for the frontend build.

```bash
git clone https://github.com/0xSidBanerjee/tusk.git
cd tusk
make build
./tusk --help
```

## Quick Start

```bash
# 1. Start the web application
./tusk serve

# 2. Start on a custom port and address
./tusk serve --port 9000 --address 0.0.0.0

# 3. Export tasks to JSON
./tusk export --format JSON --export-path tasks.json

# 4. Export all tasks to a directory (auto-generates filename)
./tusk export --format YAML --export-path ./exports/
```

## CLI Reference

### Global Flags
| Flag | Description | Default |
| --- | --- | --- |
| `-d, --db-file` | Path to the SQLite database file | `todo.db` |
| `-h, --help` | Help for tusk | - |

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
| `-f, --format` | The format to export as (CSV, JSON, YAML, TOML) | `CSV` |
| `-l, --export-path` | The location or filename for the output | `.` |

---

## Development

Tusk uses a `Makefile` for standard development tasks:

| Target | Description |
| --- | --- |
| `make deps` | Install Go and Node.js dependencies |
| `make lint` | Run Go vet and ESLint |
| `make fmt` | Format Go and React code |
| `make test` | Run the full test suite (Go + Frontend) |
| `make build` | Build the optimized single binary |
| `make run` | Build and run the app directly |
| `make clean` | Remove all build and export artifacts |

## Technology Stack
- **Backend**: Go, Gin Framework, SQLite, Cobra CLI.
- **Frontend**: React, Vite, TanStack Query (React Query), Tailwind CSS, Lucide icons.
- **Ops**: GitHub Actions (CI), GoReleaser (CD).

## License
See [`LICENSE`](LICENSE).
