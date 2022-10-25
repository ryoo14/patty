import { Command, HelpCommand } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/ensure_dir.ts";


new Command()
  .name("patty")
  .version("0.1.0")
  .description("a CLI tool for managing git and tmp directories written in Deno.")
  .default("help")
  // Create
  .command("create <dir:string>", "Create a tmp but non-git managed directory.")
  .action((_, dir) => create(dir))
  // Get
  .command("get", "Get a git repository from GitHub or GitLab.")
  .action(() => get())
  // List
  .command("list", "Print git and tmp directories.")
  .option("-f, --full-path", "Print full paths instead of relative paths.")
  .action((option) => list(option))
  // Root
  .command("root", "Print root path on patty's configuration.")
  .action(() => root())
  .command("help", new HelpCommand())
  .parse();

const getPattyRoot = () => {
  const pattyRoot = Deno.env.get("PATTY_ROOT");
  return pattyRoot ? pattyRoot : Deno.env.get("HOME") + "/patty";
}

const create = (dir: string) => {
  const targetDir = join(getPattyRoot(), dir, ".patty");
  ensureDir(targetDir);
};

const get = () => {
  console.log("get");
};

const list = (option) => {
  console.log("list");
};

const root = () => {
  console.log(getPattyRoot());
};

