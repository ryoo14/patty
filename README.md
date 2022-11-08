# Patty
`patty` is a CLI tool for managing git and tmp directories written in Deno.

## Installation

```sh
deno install --allow-read --allow-write --allow-env --allow-run https://deno.land/x/patty@0.1.2/patty.ts
```

## Usage
```
  Usage:   patty
  Version: 0.1.0

  Description:

    a CLI tool for managing git and tmp directories written in Deno.

  Options:

    -h, --help     - Show this help.
    -V, --version  - Show the version number for this program.

  Commands:

    create  <dir>      - Create a tmp but non-git managed directory.
    get     <url>      - Get a git repository from remote repository services.
    list               - Print git and tmp directories.
    root               - Print root path on patty's configuration.
    help    [command]  - Show this help or the help of a sub-command.
```

## Environment Variable

- `PATTY_ROOT`
  - If this environment variable is set, `patty` will use it as the root path. If it is not set, it defaults to `$HOME/patty`.
