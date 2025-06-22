import { ensureDir } from "@std/fs"
import { join, relative, resolve } from "@std/path"
import type { Options } from "./types.ts"
import { getPattyDirs, getPattyRoot, parseUrlToSchemeAuthority } from "./utils.ts"

// commands functions
export const create = async (options: Options, dir: string) => {
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

export const get = async (options: Options, url: string) => {
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

export const list = async (option: Options) => {
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

export const root = () => {
  console.log(getPattyRoot())
}