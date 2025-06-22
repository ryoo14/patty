// types
export type Options = {
  gitInit?: boolean
  branch?: string
  depth?: number
  quiet?: boolean
  fullPath?: boolean
}

export type RemoteRepositoryServiceUrls = {
  [key: string]: string
}
