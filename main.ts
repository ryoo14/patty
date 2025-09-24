import { Command } from "@cliffy/command"
import { HelpCommand } from "@cliffy/command/help"
import { create, get, list, root } from "./commands.ts"

try {
  await new Command()
    .name("patty")
    .version("0.11.1")
    .description("a CLI tool for managing git and working directories written in Deno.")
    .default("help")
    // Create
    .command("create <dir:string>", "Create a working but non-git managed directory.")
    .option("-g, --git-init", "Initialize git repository.")
    .action(async (options, dir) => await create(options, dir))
    // Get
    .command("get <url:string>", "Get a git repository from remote repository services.")
    .option("-b, --branch <branch:string>", "Get Specified branch.")
    .option("-d, --depth <depth:number>", "Create a shallow clone of that depth.")
    .option("-q, --quiet", "Suppress output.")
    .example("full url", "patty get https://github.com/user/repo")
    .example("short url", "patty get github.com/user/repo")
    .example("user and repo", "patty get user/repo")
    .action((options, url) => get(options, url))
    // List
    .command("list", "Print git and working directories.")
    .option("-d, --depth <depth:number>", "Specify how many layers of git and tmp directories to target.")
    .option("-f, --full-path", "Print full paths instead of relative paths.")
    .action((option) => list(option))
    // Root
    .command("root", "Print root path on patty's configuration.")
    .action(() => root())
    .command("help", new HelpCommand())
    .parse()
} catch (error) {
  console.error(error.message)
  Deno.exit(1)
}
