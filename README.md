# Tusk

> A single-binary todo manager. Web UI, TUI, and CLI. No account. No cloud. Your data is a file.

Tusk is for people who don't want their task list to require a subscription, an internet connection, or a privacy policy. One binary. SQLite on disk. Three interfaces — use whichever fits the moment.

![License](https://img.shields.io/github/license/0xSidBanerjee/tusk)
![Release](https://img.shields.io/github/v/release/0xSidBanerjee/tusk)
![CI](https://img.shields.io/github/actions/workflow/status/0xSidBanerjee/tusk/ci.yml?label=ci)
![Go Version](https://img.shields.io/github/go-mod/go-version/0xSidBanerjee/tusk)
[![Go Report Card](https://goreportcard.com/badge/github.com/0xSidBanerjee/tusk)](https://goreportcard.com/report/github.com/0xSidBanerjee/tusk)

---

## 📑 Table of Contents
- [Why Tusk?](#why-tusk)
- [Quick Start](#quick-start)
- [Interfaces](#interfaces)
  - [Web UI](#web-ui)
  - [TUI](#tui)
  - [CLI](#cli)
- [Data Storage](#data-storage)
- [Architecture](#architecture)
- [Development](#development)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Why Tusk?

Most todo apps require an account. Many phone home. Some charge monthly. Tusk does none of that.

- 📦 **One binary** — backend, frontend, and SQLite all baked in. Copy it anywhere and run it.
- 💻 **Three interfaces** — Web UI for comfort, TUI for terminal-native flow, CLI for scripting and automation.
- 🔒 **Your data** — stored in a single SQLite file on your disk. Export it, back it up, put it in Git. You own it.
- 🕶️ **Privacy first** — No account, no cloud, no telemetry.

---

## Quick Start

### Docker (Recommended)
```bash
docker run -p 8080:8080 -v tusk-data:/home/nonroot/.local/share/tusk ghcr.io/0xsidbanerjee/tusk
```
Open [http://localhost:8080](http://localhost:8080).

### Binary Install
```bash
# macOS / Linux
curl -sSL https://github.com/0xSidBanerjee/tusk/releases/latest/download/tusk_$(uname -s)_$(uname -m).tar.gz | tar xz
./tusk serve
```

### From Source
```bash
git clone https://github.com/0xSidBanerjee/tusk.git
cd tusk
make build
./tusk serve
```

---

## Interfaces

### Web UI
Full task management with lists, priorities, deadlines, filters, import/export, and light/dark theme.
```bash
./tusk serve
# Default: http://localhost:8080
```

### TUI
Keyboard-first terminal interface using Vim keybindings.
```bash
./tusk tui
```

| Key | Action |
|-----|--------|
| `j/k` | Navigate |
| `n` | New task |
| `e` | Edit task |
| `d` | Delete task |
| `x` | Toggle done |
| `Tab` | Switch panel |
| `?` | Help |

### CLI
Perfect for scripting and automation.
```bash
# Add a task
./tusk add "Fix login bug | high | tomorrow"

# List tasks
./tusk list --priority high --deadline today

# Export/Import
./tusk export --format json --export-path ./backup.json
./tusk import --format yaml --input-file ./backup.yaml
```

---

## Data Storage

Tasks are stored in a SQLite file. Default location follows platform conventions:

| Platform | Default path |
|----------|-------------|
| Linux | `~/.local/share/tusk/tusk.db` |
| macOS | `~/Library/Application Support/tusk/tusk.db` |
| Windows | `%APPDATA%\tusk\tusk.db` |

Override with `--db-file`:
```bash
./tusk serve --db-file ~/notes/work.db
```

---

## Architecture

Tusk is designed for zero-friction deployment and absolute data ownership.

- **Go Backend**: A high-performance, statically typed core.
- **SQLite Database**: Uses `modernc.org/sqlite` (pure Go, no CGO) for maximum portability across architectures.
- **Embedded Frontend**: The React Web UI is compiled and embedded into the binary using `go:embed`.
- **TUI**: Built with the [Charm](https://charm.sh) stack (Bubbletea, Lipgloss).

---

## Development

Requirements: **Go 1.22+**, **Node.js 20+**

```bash
make deps          # Install all dependencies
make build-web     # Build React frontend
make build         # Build single binary (includes frontend)
make test          # Run tests with race detector
make lint          # Run linters
make run           # Run locally (dev mode)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development guide.

---

## Roadmap

- [ ] Subtasks (one level)
- [ ] `tusk add` and `tusk list` CLI subcommands
- [ ] Watch mode (auto-import from a watched directory)
- [ ] Homebrew tap
- [ ] Smart lists (Today, Scheduled, Flagged)

---

## Contributing

PRs and issues are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

---

## License

MIT — see [LICENSE](LICENSE).