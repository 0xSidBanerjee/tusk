# Contributing to Tusk

Thanks for your interest. Tusk is a small project and contributions are welcome — bug fixes, features from the roadmap, documentation improvements, and test coverage.

## Before You Start

- Check [open issues](https://github.com/0xSidBanerjee/tusk/issues) to avoid duplicate work.
- For significant features, open an issue first to discuss the approach before writing code.
- Small fixes (typos, documentation, obvious bugs) can go straight to a PR.

## Development Setup

Requirements: Go 1.22+, Node.js 20+

```bash
git clone https://github.com/0xSidBanerjee/tusk.git
cd tusk
make deps
make build
./tusk serve
```

## Project Structure

```text
tusk/
├── cmd/              # Cobra CLI commands (serve, export, import, tui, add, list)
├── internal/
│   ├── db/           # SQLite store interfaces and implementations
│   ├── handler/      # Gin HTTP handlers
│   ├── model/        # Task and List structs
│   ├── export/       # Export/import formatters
│   └── tui/          # Bubbletea TUI
├── web/              # React frontend (Vite, Tailwind, shadcn-ui)
├── main.go
└── Makefile
```

## Making Changes

### Backend (Go)
- Follow standard Go project conventions.
- All DB access goes through the `TaskStore` and `ListStore` interfaces — don't write SQL in handlers.
- Use `slog` for structured logging — no `fmt.Println` in production paths.
- Run `make lint` before pushing.

### Frontend (React/TypeScript)
- Strict TypeScript — no `any`.
- All API calls go through `web/src/api/` — no raw `fetch` in components.
- Server state via React Query — no manual `useEffect` + `useState` for data fetching.
- Use shadcn-ui components and Tailwind tokens — no hardcoded colors.

### Tests
- New DB functionality should have unit tests using in-memory SQLite (`:memory:`).
- New API endpoints should have integration tests using `httptest`.
- Run `make test` to verify.

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(db): add completed_at timestamp to tasks
fix(ui): hide zero counts in sidebar
docs: update CLI reference in README
test(export): add round-trip import/export test
```

**Scopes:** `db`, `api`, `ui`, `tui`, `cli`, `export`, `ci`, `docs`.

## Pull Requests

- One concern per PR. Don't bundle unrelated changes.
- PRs must pass CI (lint + tests + build) before review.
- Fill out the PR template.
- Keep the diff readable — prefer smaller focused PRs over large ones.

## Branch Naming

```text
feat/quick-add-input
fix/pagination-scroll-reset
docs/contributing-guide
```

## What's Not Welcome

- Features that require an account, cloud sync, or external services by default.
- Breaking changes to the export/import format without a migration path.
- UI changes that introduce hardcoded colors or break the theming system.
- Dependencies with non-permissive licenses.