import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function runSeoScript(scriptName) {
  try {
    return await execFileAsync(process.execPath, [path.join(ROOT, "scripts", scriptName)], {
      cwd: ROOT,
    });
  } catch (error) {
    return {
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      code: error.code,
    };
  }
}

test("SEO scanners ignore non-public HTML folders", async () => {
  for (const scriptName of ["seo-health-check.mjs", "seo-ci-check.mjs"]) {
    const { stdout } = await runSeoScript(scriptName);
    assert.doesNotMatch(stdout, /\.agents\//);
    assert.doesNotMatch(stdout, /components\//);
  }
});
