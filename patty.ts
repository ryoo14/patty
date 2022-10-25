import dir from "https://deno.land/x/dir@1.5.1/mod.ts";
import { Command, HelpCommand } from "https://deno.land/x/cliffy@v0.25.2/command/mod.ts";
import { ensureDir } from "https://deno.land/std@0.160.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.160.0/path/mod.ts";


new Command()
  .name("patty")
  .version("0.1.0")
  .description("a CLI tool for managing git and tmp directories written in Deno.")
  .default("help")
  // Create
  .command("create <dir:string>", "Create a tmp but non-git managed directory.")
  .action((_, dir) => create(dir))
  // Get
  .command("get <url:string>", "Get a git repository from GitHub or GitLab.")
  .example("full url", "patty get https://github.com/ryoo14/patty")
  .example("short url", "patty get github.com/ryoo14/patty")
  .action((_, url) => get(url))
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
  const home = dir("home");
  const homePattyRoot = home ? join(home, "patty") : undefined;
  const pattyRoot = Deno.env.get("PATTY_ROOT") ?? homePattyRoot;
  if (!pattyRoot) {
    console.error("Not defined $PATTY_ROOT and $HOME.");
    Deno.exit(1);
  } else {
    return pattyRoot;
  }
};

const create = (dir: string) => {
  const targetDir = join(getPattyRoot(), dir, ".patty");
  ensureDir(targetDir);
};

const get = (url: string) => {
  console.log(url);
};

const list = (option) => {
  console.log("list");
};

const root = () => {
  console.log(getPattyRoot());
};

