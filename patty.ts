import dir from "https://deno.land/x/dir@1.5.1/mod.ts";
import { Command, HelpCommand } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
import { ensureDir, walk } from "https://deno.land/std@0.173.0/fs/mod.ts";
import { dirname, join, relative } from "https://deno.land/std@0.173.0/path/mod.ts";

new Command()
  .name("patty")
  .version("0.5.0")
  .description("a CLI tool for managing git and working directories written in Deno.")
  .default("help")
  // Create
  .command("create <dir:string>", "Create a working but non-git managed directory.")
  .option("-g, --git-init", "Initialize git repository.")
  .action((options, dir) => create(options, dir))
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

const getPattyDirs = async (depth = 4) => {
  const walkOptions = {
    maxDepth: depth,
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

async function repositoryExists(user: string, repo: string): Promise<string> {
  let authority = "";
  const remoteRepositoryServices = {
    "github.com": `https://api.github.com/repos/${user}/${repo}`,
    "gitlab.com": `https://gitlab.com/api/v4/projects/${user}%2F${repo}`,
  };
  try {
    for (const service of Object.keys(remoteRepositoryServices)) {
      const response = await fetch(remoteRepositoryServices[service]);
      if (response.status < 300) {
        authority = `${service}/${user}/${repo}`;
        break;
      }
    }
  } catch (error) {
    console.log(error);
    Deno.exit(1);
  }
  return authority;
}

// commands functions
const create = async (options, dir: string) => {
  const targetDir = join(getPattyRoot(), dir);
  ensureDir(join(targetDir, ".patty"));

  if (options.gitInit) {
    const command = `git init -q ${targetDir}`;
    const gitProcess = Deno.run({
      cmd: ["bash", "-c", command],
    });

    await gitProcess.status();
  }
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

  const scheme_flag = url.match(/^(https|git):\/\//);
  let scheme, authority: string;
  if (scheme_flag) {
    [scheme, authority] = url.split("://");
  } else {
    // TODO: function
    const slashNum = url.match(/\//g).length;
    if (slashNum === 2) {
      [scheme, authority] = ["https", url];
    } else if (slashNum === 1) {
      const [user, repo] = url.split("/");
      [scheme, authority] = ["https", await repositoryExists(user, repo)];
      if (!authority) {
        console.log(
          "Specified repository does not exist. If repository is private, please specify remote repository service domain. e.g. github.com/user/repo",
        );
        Deno.exit(1);
      }
    }
  }
  const pattyRoot = getPattyRoot();
  const command = `git clone ${gitOptions.join(" ")} ${scheme}://${authority} ${pattyRoot}/${authority}`;
  const gitProcess = Deno.run({
    cmd: ["bash", "-c", command],
  });

  await gitProcess.status();
};

const list = async (option) => {
  const pattySet = await getPattyDirs(option.depth);

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
