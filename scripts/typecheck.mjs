import ts from "typescript";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// A solution config with files: [] does not check its references in plain tsc
// mode. Check every referenced project explicitly, even if an earlier one fails.
const root = process.cwd();
const config = ts.readConfigFile(resolve(root, "tsconfig.json"), ts.sys.readFile);
if (config.error) {
  console.error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
  process.exit(1);
}
const references = config.config.references;
if (!Array.isArray(references) || references.length === 0) {
  console.error("Typecheck requires at least one referenced project.");
  process.exit(1);
}
const compiler = fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url));
let failed = false;
for (const reference of references) {
  if (typeof reference?.path !== "string") {
    console.error("Invalid TypeScript project reference.");
    failed = true;
    continue;
  }
  console.log(`Typechecking ${reference.path}`);
  const result = spawnSync(process.execPath, [compiler, "--noEmit", "--project", resolve(root, reference.path)], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
