import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const skillsRoot = path.join(root, '.agents', 'skills');
const lockPath = path.join(root, 'skills-lock.json');

async function readSkillDirectories() {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const directories = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(skillsRoot, entry.name);
    const skillFile = path.join(directory, 'SKILL.md');
    try {
      await stat(skillFile);
    } catch {
      throw new Error(`Missing SKILL.md: .agents/skills/${entry.name}/SKILL.md`);
    }
    directories.push({ name: entry.name, skillFile });
  }
  return directories.sort((a, b) => a.name.localeCompare(b.name));
}

function skillName(markdown) {
  const match = markdown.match(/^---\s*\n[\s\S]*?^name:\s*([^\n]+)\s*$/m);
  return match?.[1]?.trim() ?? null;
}

async function buildEntries(directories, existing) {
  const skills = {};
  for (const { name, skillFile } of directories) {
    const contents = await readFile(skillFile);
    const declaredName = skillName(contents.toString('utf8'));
    if (declaredName !== name) {
      throw new Error(`Skill name mismatch: ${name} (SKILL.md declares ${declaredName ?? 'missing'})`);
    }
    const previous = existing?.skills?.[name];
    skills[name] = {
      source: previous?.source ?? 'local',
      sourceType: previous?.sourceType ?? 'local',
      skillPath: path.posix.join('.agents/skills', name, 'SKILL.md'),
      computedHash: createHash('sha256').update(contents).digest('hex'),
    };
  }
  return skills;
}

async function main() {
  const directories = await readSkillDirectories();
  let existing = null;
  try {
    existing = JSON.parse(await readFile(lockPath, 'utf8'));
  } catch {
    // --write can create the lock from scratch.
  }
  const expected = { version: 1, skills: await buildEntries(directories, existing) };
  const actualText = await readFile(lockPath, 'utf8').catch(() => '');
  const expectedText = `${JSON.stringify(expected, null, 2)}\n`;

  if (process.argv.includes('--write')) {
    await writeFile(lockPath, expectedText);
    console.log(`Wrote skills-lock.json: ${directories.length} entries.`);
    return;
  }

  if (actualText !== expectedText) {
    throw new Error('skills-lock.json is stale. Run: node scripts/qa/verify-skills-lock.mjs --write');
  }
  console.log(`Skills lock verified: ${directories.length} directories, ${Object.keys(expected.skills).length} entries, hashes match.`);
}

main().catch((error) => {
  console.error(`Skills lock verification failed: ${error.message}`);
  process.exitCode = 1;
});
