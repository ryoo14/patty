# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- **Development**: `deno task dev` - Runs format, lint, and test with fail-fast
- **Run locally**: `deno task run` - Execute patty with required permissions
- **Testing**: `deno task test` - Run full test suite with all required permissions
- **Dependencies**: `deno task update` - Update dependencies using molt
- **Update with commit**: `deno task update:commit` - Update deps and auto-commit with formatting

### Manual Commands

- **Format**: `deno fmt`
- **Lint**: `deno lint`
- **Direct execution**: `deno run --allow-read --allow-write --allow-env --allow-run main.ts [command]`

## Architecture

This is a single-file CLI application (`main.ts`) built with Deno that manages Git repositories and working directories.

### Core Components

**Command Structure**: Built using Cliffy command framework with four main commands:

- `get`: Clone remote repositories with intelligent URL parsing
- `create`: Create non-git managed working directories
- `list`: Display managed directories with filtering options
- `root`: Show configuration root path

**Directory Management**: The application maintains a workspace under `PATTY_ROOT` (default: `$HOME/patty`) and identifies managed directories by presence of
`.git` or `.patty` markers.

**URL Resolution**: The `get` command supports multiple URL formats:

- Full URLs: `https://github.com/user/repo`
- Short URLs: `github.com/user/repo`
- User/repo format: `user/repo` (auto-detects GitHub/GitLab)

**Repository Detection**: Uses GitHub and GitLab APIs to automatically detect repository existence when using short formats.

### Key Functions

- `getPattyRoot()`: Environment-based root path resolution
- `getPattyDirs()`: Directory discovery using filesystem walking
- `repositoryExists()`: API-based repository validation for GitHub/GitLab

### Testing Architecture

Tests use a custom `pattyTest()` wrapper that:

- Creates temporary directories for isolation
- Sets up `PATTY_ROOT` environment variable
- Cleans up after each test
- Uses `@david/dax` CommandBuilder for shell command execution

All tests verify actual filesystem operations and git commands rather than mocking.

## Project Configuration

- **Runtime**: Deno with JSR dependencies
- **Formatting**: 160 character line width, spaces (not tabs), no semicolons
- **Permissions**: Requires read, write, env, run, and net permissions for full functionality
- **Dependencies**: Uses JSR packages for standard library, CLI framework, and shell operations
