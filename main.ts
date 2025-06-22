import { Command } from "@cliffy/command"
import { HelpCommand } from "@cliffy/command/help"
import { ensureDir, walk } from "@std/fs"
import { dirname, join, relative, resolve } from "@std/path"

// types
type Options = {
  gitInit?: boolean
  branch?: string
  depth?: number
  quiet?: boolean
  fullPath?: boolean
}

type RemoteRepositoryServiceUrls = {
  [key: string]: string
}

// utility functions
const getPattyRoot = () => {
  const home = Deno.env.get("HOME")
  const homePattyRoot = home ? join(home, "patty") : undefined
  const pattyRoot = Deno.env.get("PATTY_ROOT") ?? homePattyRoot
  if (!pattyRoot) {
    throw new Error("Not defined $PATTY_ROOT and $HOME.")
  } else {
    return pattyRoot
  }
}

const getPattyDirs = async (depth = 4) => {
  const walkOptions = {
    maxDepth: depth,
    includeFiles: false,
    includeDirs: true,
    match: [RegExp(/\.(git|patty)$/)],
  }

  const pattySet: Set<string> = new Set()

  for await (const l of walk(getPattyRoot(), walkOptions)) {
    pattySet.add(dirname(l.path))
  }

  return pattySet
}

async function repositoryExists(user: string, repo: string): Promise<string> {
  let authority = ""
  const remoteRepositoryServices: RemoteRepositoryServiceUrls = {
    "github.com": `https://api.github.com/repos/${user}/${repo}`,
    "gitlab.com": `https://gitlab.com/api/v4/projects/${user}%2F${repo}`,
  }
  try {
    for (const service of Object.keys(remoteRepositoryServices)) {
      const response = await fetch(remoteRepositoryServices[service])
      if (response.status < 300) {
        authority = `${service}/${user}/${repo}`
        break
      }
    }
  } catch (error) {
    throw new Error(`Failed to check repository existence: ${error.message}`)
  }
  return authority
}

async function parseUrlToSchemeAuthority(url: string): Promise<[string, string]> {
  const scheme_flag = url.match(/^(https|git):\/\//)

  if (scheme_flag) {
    const [scheme, authority] = url.split("://")
    return [scheme, authority]
  }

  const slashNum = url.match(/\//g)?.length ?? 0
  if (slashNum === 2) {
    return ["https", url]
  } else if (slashNum === 1) {
    const [user, repo] = url.split("/") as [string, string]
    const authority = await repositoryExists(user, repo)
    if (!authority) {
      throw new Error(
        "Specified repository does not exist. If repository is private, please specify remote repository service domain. e.g. github.com/user/repo",
      )
    }
    return ["https", authority]
  } else {
    throw new Error(
      "Specified repository does not exist. If repository is private, please specify remote repository service domain. e.g. github.com/user/repo",
    )
  }
}

// commands functions
const create = async (options: Options, dir: string) => {
  const targetDir = join(getPattyRoot(), dir)

  try {
    await ensureDir(join(targetDir, ".patty"))
  } catch (error) {
    throw new Error(`Failed to create directory: ${error.message}`)
  }

  if (options.gitInit) {
    const gitProcess = new Deno.Command(
      "git",
      {
        args: [
          "init",
          "-q",
          targetDir,
        ],
      },
    )

    const result = await gitProcess.output()
    if (!result.success) {
      throw new Error(`Git init failed: ${new TextDecoder().decode(result.stderr)}`)
    }
  }
}

const get = async (options: Options, url: string) => {
  // Safe git options processing
  const gitArgs = ["clone"]

  // Only allow specific, safe options
  if (options.branch) {
    gitArgs.push("--branch", options.branch)
  }
  if (options.depth) {
    gitArgs.push("--depth", options.depth.toString())
  }
  if (options.quiet) {
    gitArgs.push("--quiet")
  }

  const [scheme, authority] = await parseUrlToSchemeAuthority(url)

  // Path traversal protection
  const pattyRoot = getPattyRoot()
  const targetPath = resolve(pattyRoot, authority)

  if (!targetPath.startsWith(pattyRoot + "/") && targetPath !== pattyRoot) {
    throw new Error("Path traversal detected: invalid repository path")
  }

  // Safe git clone execution
  gitArgs.push(`${scheme}://${authority}`, targetPath)

  const gitProcess = new Deno.Command("git", {
    args: gitArgs,
  })

  const result = await gitProcess.output()
  if (!result.success) {
    throw new Error(`Git clone failed: ${new TextDecoder().decode(result.stderr)}`)
  }
}

const list = async (option: Options) => {
  const pattySet: Set<string> = await getPattyDirs(option.depth)

  if (option.fullPath) {
    for (const l of pattySet) {
      console.log(l)
    }
  } else {
    for (const l of pattySet) {
      console.log(relative(getPattyRoot(), l))
    }
  }
}

const root = () => {
  console.log(getPattyRoot())
}

try {
  await new Command()
    .name("patty")
    .version("0.10.0")
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
