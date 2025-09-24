import { walk } from "@std/fs"
import { dirname, join } from "@std/path"
import type { RemoteRepositoryServiceUrls } from "./types.ts"

// utility functions
export const getPattyRoot = () => {
  const home = Deno.env.get("HOME")
  const homePattyRoot = home ? join(home, "patty") : undefined
  const pattyRoot = Deno.env.get("PATTY_ROOT") || homePattyRoot
  if (!pattyRoot) {
    throw new Error("Not defined $PATTY_ROOT and $HOME.")
  } else {
    return pattyRoot
  }
}

export const getPattyDirs = async (depth = 4) => {
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

export async function repositoryExists(user: string, repo: string): Promise<string> {
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

export async function parseUrlToSchemeAuthority(url: string): Promise<[string, string]> {
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
