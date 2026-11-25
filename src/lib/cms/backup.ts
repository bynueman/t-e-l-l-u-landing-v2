import fs from "node:fs";
import path from "node:path";
import { backup, DatabaseSync } from "node:sqlite";
import { closeDb, getDb } from "./db.ts";
import { getCmsPaths } from "./paths.ts";

export interface BackupManifest {
  createdAt: string;
  dbFilename: string;
  mediaIncluded: boolean;
  mediaFileCount: number;
  note: string;
}

function copyDirRecursive(src: string, dest: string): number {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      count += 1;
    }
  }
  return count;
}

export async function createCmsBackup(targetDir?: string): Promise<{
  backupDir: string;
  manifest: BackupManifest;
}> {
  const paths = getCmsPaths();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destRoot = targetDir
    ? path.resolve(targetDir)
    : path.join(paths.backupDir, `tellu-cms-backup-${stamp}`);

  fs.mkdirSync(destRoot, { recursive: true });

  const db = getDb();
  const dbBackupPath = path.join(destRoot, "tellu.sqlite");

  // SQLite-consistent online backup handling active WAL state safely
  await backup(db, dbBackupPath);

  const mediaDest = path.join(destRoot, "media");
  const mediaFileCount = copyDirRecursive(paths.mediaDir, mediaDest);

  const manifest: BackupManifest = {
    createdAt: new Date().toISOString(),
    dbFilename: "tellu.sqlite",
    mediaIncluded: true,
    mediaFileCount,
    note: "TELLU CMS SQLite online backup + persistent media snapshot",
  };

  fs.writeFileSync(path.join(destRoot, "manifest.json"), JSON.stringify(manifest, null, 2));

  return { backupDir: destRoot, manifest };
}

export function restoreCmsBackup(backupSourceDir: string): {
  restoredDbPath: string;
  restoredMediaCount: number;
} {
  const resolvedSource = path.resolve(backupSourceDir);
  const manifestPath = path.join(resolvedSource, "manifest.json");
  const sourceDbPath = path.join(resolvedSource, "tellu.sqlite");

  if (!fs.existsSync(manifestPath) || !fs.existsSync(sourceDbPath)) {
    throw new Error("Direktori backup tidak valid: manifest.json atau tellu.sqlite tidak ditemukan.");
  }

  // Verify SQLite integrity before restoring
  const checkDb = new DatabaseSync(sourceDbPath, { readOnly: true });
  try {
    const integrity = checkDb.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
    if (integrity.integrity_check !== "ok") {
      throw new Error(`Integrity check backup gagal: ${integrity.integrity_check}`);
    }
  } finally {
    checkDb.close();
  }

  const paths = getCmsPaths();
  closeDb();

  fs.mkdirSync(paths.dbDir, { recursive: true });
  for (const suffix of ["", "-wal", "-shm"]) {
    const targetFile = `${paths.dbPath}${suffix}`;
    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
    }
  }
  fs.copyFileSync(sourceDbPath, paths.dbPath);

  const sourceMedia = path.join(resolvedSource, "media");
  fs.rmSync(paths.mediaDir, { recursive: true, force: true });
  fs.mkdirSync(paths.mediaDir, { recursive: true });
  const restoredMediaCount = copyDirRecursive(sourceMedia, paths.mediaDir);

  // Re-open and ensure migrations are current
  getDb();

  return {
    restoredDbPath: paths.dbPath,
    restoredMediaCount,
  };
}
