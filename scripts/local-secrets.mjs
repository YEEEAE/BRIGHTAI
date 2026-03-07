#!/usr/bin/env node

import { pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

const DEFAULT_ENV_NAME = "BRIGHTAI_SECRETS_PASSPHRASE";
const ITERATIONS = 210000;
const KEY_LENGTH = 32;
const ALGORITHM = "aes-256-gcm";

function printUsage() {
  console.log(`
الاستخدام:
  node scripts/local-secrets.mjs encrypt --in <input> --out <output> [--env PASS_VAR]
  node scripts/local-secrets.mjs decrypt --in <input> --out <output> [--env PASS_VAR]

أمثلة:
  node scripts/local-secrets.mjs encrypt --in backend/.env.local --out secrets/backend.env.enc
  node scripts/local-secrets.mjs decrypt --in secrets/backend.env.enc --out backend/.env.local

ملاحظات:
  - إذا لم يوجد متغير كلمة المرور في البيئة، السكربت سيطلبها منك محلياً.
  - لا ترفع ملفات .env المفكوكة إلى GitHub.
  `);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    printUsage();
    process.exit(command ? 0 : 1);
  }

  const options = {
    envName: DEFAULT_ENV_NAME,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    const next = rest[index + 1];

    if (token === "--in") {
      options.input = next;
      index += 1;
      continue;
    }

    if (token === "--out") {
      options.output = next;
      index += 1;
      continue;
    }

    if (token === "--env") {
      options.envName = next || DEFAULT_ENV_NAME;
      index += 1;
      continue;
    }

    throw new Error(`خيار غير معروف: ${token}`);
  }

  if (!options.input || !options.output) {
    throw new Error("لازم تحدد --in و --out");
  }

  if (!["encrypt", "decrypt"].includes(command)) {
    throw new Error(`الأمر غير مدعوم: ${command}`);
  }

  return {
    command,
    input: resolve(options.input),
    output: resolve(options.output),
    envName: options.envName,
  };
}

function ensureFileExists(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`الملف غير موجود: ${filePath}`);
  }
}

function ensureParentDir(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

async function readHidden(promptText) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("شغّل السكربت من طرفية تفاعلية أو مرر كلمة المرور عبر متغير بيئة.");
  }

  return new Promise((resolvePromise, rejectPromise) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let value = "";

    const cleanup = () => {
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.removeListener("data", onData);
    };

    const onData = (chunk) => {
      const text = String(chunk);

      if (text === "\u0003") {
        cleanup();
        stdout.write("\n");
        rejectPromise(new Error("تم إلغاء الإدخال."));
        return;
      }

      if (text === "\r" || text === "\n") {
        cleanup();
        stdout.write("\n");
        resolvePromise(value);
        return;
      }

      if (text === "\u007f") {
        value = value.slice(0, -1);
        return;
      }

      value += text;
    };

    stdout.write(promptText);
    stdin.resume();
    stdin.setEncoding("utf8");
    stdin.setRawMode?.(true);
    stdin.on("data", onData);
  });
}

async function getPassphrase(envName) {
  const fromEnv = String(process.env[envName] || "").trim();
  if (fromEnv) {
    return fromEnv;
  }

  const entered = String(await readHidden(`أدخل كلمة مرور التشفير [${envName}]: `)).trim();
  if (!entered) {
    throw new Error("كلمة المرور فارغة.");
  }
  return entered;
}

function deriveKey(passphrase, salt) {
  return pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LENGTH, "sha256");
}

function encryptText(plainText, passphrase) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(passphrase, salt);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return JSON.stringify(
    {
      version: 1,
      algorithm: ALGORITHM,
      kdf: "pbkdf2-sha256",
      iterations: ITERATIONS,
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      tag: authTag.toString("base64"),
      data: ciphertext.toString("base64"),
    },
    null,
    2
  );
}

function decryptText(encryptedText, passphrase) {
  const payload = JSON.parse(encryptedText);
  if (payload.version !== 1 || payload.algorithm !== ALGORITHM) {
    throw new Error("صيغة الملف المشفر غير مدعومة.");
  }

  const salt = Buffer.from(String(payload.salt || ""), "base64");
  const iv = Buffer.from(String(payload.iv || ""), "base64");
  const tag = Buffer.from(String(payload.tag || ""), "base64");
  const data = Buffer.from(String(payload.data || ""), "base64");
  const key = deriveKey(passphrase, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    ensureFileExists(args.input);
    ensureParentDir(args.output);

    const passphrase = await getPassphrase(args.envName);
    const source = readFileSync(args.input, "utf8");

    if (args.command === "encrypt") {
      const encrypted = encryptText(source, passphrase);
      writeFileSync(args.output, encrypted, "utf8");
      console.log(`تم تشفير الملف بنجاح: ${args.output}`);
      return;
    }

    const decrypted = decryptText(source, passphrase);
    writeFileSync(args.output, decrypted, "utf8");
    console.log(`تم فك التشفير بنجاح: ${args.output}`);
  } catch (error) {
    console.error(`فشل التنفيذ: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
