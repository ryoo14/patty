import { assertEquals, assertMatch, assertNotMatch } from "https://deno.land/std@0.170.0/testing/asserts.ts";
import { CommandBuilder } from "https://deno.land/x/dax@0.17.0/mod.ts";

const tmpDir = Deno.makeTempDirSync();
Deno.mkdirSync(`${tmpDir}/patty`);

const builder = new CommandBuilder()
  .env("PATTY_ROOT", `${tmpDir}/patty`);

// help
Deno.test("help", async () => {
  assertMatch(
    await builder.command("deno run -A patty.ts help").text(),
    /patty/,
  );
});

// root
Deno.test("root", async () => {
  assertEquals(
    await builder.command("deno run -A patty.ts root").text(),
    `${tmpDir}/patty`,
  );
});

// get
Deno.test("getDefault", async () => {
  await builder.command("deno run -A patty.ts get -q https://github.com/ryoo14/patty").spawn();
  assertEquals(
    await builder.command("ls -d $PATTY_ROOT/github.com/ryoo14/patty").text(),
    `${tmpDir}/patty/github.com/ryoo14/patty`,
  );
});

Deno.test("getOnlyUserAndRepo", async () => {
  await builder.command("deno run -A patty.ts get -q ryoo14/test_repo").spawn();
  assertEquals(
    await builder.command("ls -d $PATTY_ROOT/github.com/ryoo14/test_repo").text(),
    `${tmpDir}/patty/github.com/ryoo14/test_repo`,
  );
});

Deno.test("getSpecifiedBranch", async () => {
  // TODO: あまりにもひどいけど思いつかないのでmvで退避
  await builder.command("mv $PATTY_ROOT/github.com/ryoo14/test_repo $PATTY_ROOT/github.com/ryoo14/test_repo_old");

  await builder.command("deno run -A patty.ts get -b test_branch -q https://github.com/ryoo14/test_repo").spawn();
  const branches = await builder.command("git -C $PATTY_ROOT/github.com/ryoo14/test_repo branch").lines();
  assertEquals(branches.length, 1);
  assertEquals(branches[0], "* test_branch");
});

// create
Deno.test("create", async () => {
  await builder.command("deno run -A patty.ts create create/testDir").spawn();
  assertEquals(
    await builder.command("ls $PATTY_ROOT/create").text(),
    "testDir",
  );
});

// list
Deno.test("shortList", async () => {
  const result = await builder.command("deno run -A patty.ts list").text();
  assertMatch(result, /github.com\/ryoo14\/patty/);
  assertMatch(result, /create\/testDir/);
});

Deno.test("fullList", async () => {
  const result = await builder.command("deno run -A patty.ts list --full-path").text();
  assertMatch(result, new RegExp(`${tmpDir}/patty/github.com/ryoo14/patty`));
  assertMatch(result, new RegExp(`${tmpDir}/patty/create/testDir`));
});

Deno.test("depthList", async () => {
  await builder.command("deno run -A patty.ts create create/hoge/fuga/depthTestDir").spawn();
  let result = await builder.command("deno run -A patty.ts list").text();
  assertNotMatch(result, /create\/hoge\/fuga\/depthTestDir/);
  result = await builder.command("deno run -A patty.ts list -d 5").text();
  assertMatch(result, /create\/hoge\/fuga\/depthTestDir/);
});

Deno.removeSync(tmpDir, { recursive: true });
