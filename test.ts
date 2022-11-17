import { assertEquals, assertMatch } from "https://deno.land/std@0.165.0/testing/asserts.ts";
import { CommandBuilder } from "https://deno.land/x/dax@0.15.0/mod.ts";

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
Deno.test("get", async () => {
  await builder.command("deno run -A patty.ts get -q https://github.com/ryoo14/patty").spawn();
  assertEquals(
    await builder.command("ls $PATTY_ROOT/github.com/ryoo14").text(),
    "patty",
  );
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

Deno.removeSync(tmpDir, { recursive: true });
