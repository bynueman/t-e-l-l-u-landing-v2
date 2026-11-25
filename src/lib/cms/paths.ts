import path from "node:path";

export function getCmsPaths() {
  const cwd = process.cwd();
  const dbPath = process.env.TELLU_CMS_DB_PATH
    ? path.resolve(process.env.TELLU_CMS_DB_PATH)
    : path.join(cwd, "data", "cms", "tellu.sqlite");

  const mediaDir = process.env.TELLU_CMS_MEDIA_DIR
    ? path.resolve(process.env.TELLU_CMS_MEDIA_DIR)
    : path.join(cwd, "data", "media");

  const backupDir = process.env.TELLU_CMS_BACKUP_DIR
    ? path.resolve(process.env.TELLU_CMS_BACKUP_DIR)
    : path.join(cwd, "data", "backups");

  return {
    dbPath,
    dbDir: path.dirname(dbPath),
    mediaDir,
    backupDir,
  };
}
