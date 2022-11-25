import dir from "https://deno.land/x/dir@1.5.1/mod.ts";
import { Command, HelpCommand } from "https://deno.land/x/cliffy@v0.25.4/command/mod.ts";
import { ensureDir, walk } from "https://deno.land/std@0.166.0/fs/mod.ts";
import { dirname, join, relative } from "https://deno.land/std@0.166.0/path/mod.ts";

new Command()
  .name("patty")
  .version("0.2.0")
  .description("a CLI tool for managing git and working directories written in Deno.")
  .default("help")
  // Create
  .command("create <dir:string>", "Create a working but non-git managed directory.")
  .action((_, dir) => create(dir))
  // Get
  .command("get <url:string>", "Get a git repository from remote repository services.")
  .option("-d, --depth <depth:number>", "Create a shallow clone of that depth.")
  .option("-q, --quiet", "Suppress output.")
  .example("full url", "patty get https://github.com/ryoo14/patty")
  .example("short url", "patty get github.com/ryoo14/patty")
  .action((options, url) => get(options, url))
  // List
  .command("list", "Print git and working directories.")
  .option("-f, --full-path", "Print full paths instead of relative paths.")
  .action((option) => list(option))
  // Root
  .command("root", "Print root path on patty's configuration.")
  .action(() => root())
  .command("help", new HelpCommand())
  .parse();

// utility functions
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

const getPattyDirs = async () => {
  const walkOptions = {
    maxDepth: 4,
    includeFiles: false,
    includeDirs: true,
    match: [RegExp(/\.(git|patty)$/)],
  };

  const pattySet = new Set();

  for await (const l of walk(getPattyRoot(), walkOptions)) {
    pattySet.add(dirname(l.path));
  }

  return pattySet;
};

// commands functions
const create = (dir: string) => {
  const targetDir = join(getPattyRoot(), dir, ".patty");
  ensureDir(targetDir);
};

const get = async (options, url: string) => {
  const gitOptions: Array<string> = [];
  for (const [key, value] of Object.entries(options)) {
    if (value) {
      if (value === true) {
        gitOptions.push(`--${key}`);
      } else {
        gitOptions.push(`--${key} ${value}`);
      }
    }
  }

  const https = url.match(/^(https|git):\/\//);
  let proto, uri: string;
  if (https) {
    [proto, uri] = url.split("://");
  } else {
    [proto, uri] = ["https", url];
  }
  const pattyRoot = getPattyRoot();
  const command = `git clone ${gitOptions.join(" ")} ${proto}://${uri} ${pattyRoot}/${uri}`;
  const p = Deno.run({
    cmd: ["bash", "-c", command],
  });

  await p.status();
};

const list = async (option) => {
  const pattySet = await getPattyDirs();

  // for!for!
  if (option.fullPath) {
    for (const l of pattySet) {
      console.log(l);
    }
  } else {
    for (const l of pattySet) {
      console.log(relative(getPattyRoot(), l));
    }
  }
};

const root = () => {
  console.log(getPattyRoot());
};
