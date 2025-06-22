# Patty

<img src="logo.svg" height="150px" alt="patty logo">

`patty` is a CLI tool for managing git and working directories written in Deno.

It is useful to work with interactive filtering tools such as [fzf](https://github.com/junegunn/fzf) and [peco](https://github.com/peco/peco).

Inspired by [ghq](https://github.com/x-motemen/ghq).

## Installation

```sh
deno install --global -A jsr:@ryoo/patty
```

## Usage

```
  Usage:   patty
  Version: 0.11.0

  Description:

    a CLI tool for managing git and working directories written in Deno.

  Options:

    -h, --help     - Show this help.
    -V, --version  - Show the version number for this program.

  Commands:

    create  <dir>      - Create a working but non-git managed directory.
    get     <url>      - Get a git repository from remote repository services.
    list               - Print git and working directories.
    root               - Print root path on patty's configuration.
    help    [command]  - Show this help or the help of a sub-command.
```

The `patty create` command creates the specified directory under the root directory and also creates a `.patty` directory.
`patty` recognizes the directory containing the `.git` or `.patty` directory as a working directory.

## Environment Variable

- `PATTY_ROOT`
  - If this environment variable is set, `patty` will use it as the root path. If it is not set, it defaults to `$HOME/patty`.

## LICENSE

[MIT](https://github.com/ryoo14/patty/LICENSE)

## Author

[ryoo14](https://github.com/ryoo14)
