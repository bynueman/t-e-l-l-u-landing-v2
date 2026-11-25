import { createInterface } from "node:readline";
import { closeDb, getDb } from "../src/lib/cms/db.ts";
import { createInternalUser } from "../src/lib/cms/users.ts";
import { createCmsBackup, restoreCmsBackup } from "../src/lib/cms/backup.ts";

function promptLine(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function promptHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    const wasRaw = Boolean(stdin.isRaw);

    if (stdin.isTTY && typeof stdin.setRawMode === "function") {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n" || ch === "\u0004") {
          if (stdin.isTTY && typeof stdin.setRawMode === "function") {
            stdin.setRawMode(wasRaw);
          }
          stdin.pause();
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") {
          value = value.slice(0, -1);
        } else {
          value += ch;
        }
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const [, , command, arg1] = process.argv;

  try {
    if (command === "migrate") {
      getDb();
      console.log("Migrasi database CMS TELLU berhasil dijalankan.");
      return;
    }

    if (command === "init-owner") {
      const db = getDb();
      const name = (await promptLine("Nama lengkap Owner: ")).trim();
      const email = (await promptLine("Email Owner: ")).trim();
      const password = await promptHidden("Kata sandi (minimal 10 karakter, tidak ditampilkan): ");
      const confirm = await promptHidden("Konfirmasi kata sandi: ");

      if (password !== confirm) {
        console.error("Konfirmasi kata sandi tidak cocok.");
        process.exitCode = 1;
        return;
      }

      const created = createInternalUser(db, null, {
        name,
        email,
        password,
        role: "owner",
      });
      console.log(`Akun Owner berhasil dibuat: ${created.name} <${created.email}> (id: ${created.id})`);
      return;
    }

    if (command === "backup") {
      const res = await createCmsBackup(arg1);
      console.log(`Backup CMS selesai disimpan di: ${res.backupDir}`);
      console.log(`Media disalin: ${res.manifest.mediaFileCount} file.`);
      return;
    }

    if (command === "restore") {
      if (!arg1) {
        console.error("Gunakan: node scripts/cms-cli.mjs restore <path-folder-backup>");
        process.exitCode = 1;
        return;
      }
      const res = restoreCmsBackup(arg1);
      console.log(`Restore berhasil ke ${res.restoredDbPath} (${res.restoredMediaCount} file media).`);
      return;
    }

    console.log("Perintah tersedia: migrate | init-owner | backup [dir] | restore <dir>");
    process.exitCode = 1;
  } finally {
    closeDb();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
