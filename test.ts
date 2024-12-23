import { assertEquals, assertMatch, assertNotEquals } from "@std/assert"
import { CommandBuilder } from "@david/dax"

function pattyTest(
  testName: string,
  fn: () => void | Promise<void>,
) {
  Deno.test(testName, async () => {
    const tmpDir = Deno.makeTempDirSync()
    Deno.mkdirSync(`${tmpDir}/patty`)
    await builder.command(`export PATTY_ROOT=${tmpDir}/patty`).exportEnv()
    await fn()
    Deno.removeSync(tmpDir, { recursive: true })
  })
}

const builder = new CommandBuilder()

// help
pattyTest("help", async () => {
  assertMatch(
    await builder.command("deno run -A main.ts help").text(),
    /patty/,
  )
})

// root
pattyTest("root", async () => {
  assertMatch(
    await builder.command("deno run -A main.ts root").text(),
    /\/patty/,
  )
})

// get
pattyTest("getDefault", async () => {
  await builder.command("deno run -A main.ts get -q https://github.com/ryoo14/patty").spawn()
  assertMatch(
    await builder.command("ls -d $PATTY_ROOT/github.com/ryoo14/patty").text(),
    /\/patty\/github.com\/ryoo14\/patty/,
  )
})

pattyTest("getOnlyUserAndRepo", async () => {
  await builder.command("deno run -A main.ts get -q github.com/ryoo14/test_repo").spawn()
  assertMatch(
    await builder.command("ls -d $PATTY_ROOT/github.com/ryoo14/test_repo").text(),
    /\/patty\/github.com\/ryoo14\/test_repo/,
  )
})

pattyTest("getSpecifiedBranch", async () => {
  await builder.command("deno run -A main.ts get -b test_branch -q https://github.com/ryoo14/test_repo").spawn()
  const branches = await builder.command("git -C $PATTY_ROOT/github.com/ryoo14/test_repo branch").lines()
  assertEquals(branches.length, 1)
  assertEquals(branches[0], "* test_branch")
})

// create
pattyTest("create", async () => {
  await builder.command("deno run -A main.ts create create/testDir").spawn()
  assertEquals(
    await builder.command("ls $PATTY_ROOT/create").text(),
    "testDir",
  )
})

pattyTest("createAndGitInit", async () => {
  await builder.command("deno run -A main.ts create -g create/testDir2").spawn()
  assertMatch(
    await builder.command("ls -a $PATTY_ROOT/create/testDir2").text(),
    /\.git/,
  )
})

// list
pattyTest("shortList", async () => {
  await builder.command("deno run -A main.ts create create/testDir").spawn()
  const result = await builder.command("deno run -A main.ts list").text()
  assertEquals(result, "create/testDir")
})

pattyTest("fullList", async () => {
  await builder.command("deno run -A main.ts create create/testDir").spawn()
  const result = await builder.command("deno run -A main.ts list --full-path").text()
  assertMatch(result, /\/patty\/create\/testDir/)
})

pattyTest("depthList", async () => {
  await builder.command("deno run -A main.ts create create/hoge/fuga/depthTestDir").spawn()
  let result = await builder.command("deno run -A main.ts list").text()
  assertNotEquals(result, "create/hoge/fuga/depthTestDir")
  result = await builder.command("deno run -A main.ts list -d 5").text()
  assertEquals(result, "create/hoge/fuga/depthTestDir")
})
