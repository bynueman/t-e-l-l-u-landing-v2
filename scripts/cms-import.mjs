import path from "node:path";
import { closeDb, getDb } from "../src/lib/cms/db.ts";
import {
  importEditorialPackage,
  resolveImportActor,
} from "../src/lib/cms/editorial-importer.ts";

function parseArgs(argv) {
  const opts = {
    packageDir: path.join(process.cwd(), "content", "blog-launch"),
    dryRun: false,
    replace: false,
    confirmReplace: false,
    publishDrafts: false,
    status: "draft",
    authorEmail: undefined,
    onlySlugs: [],
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--replace") opts.replace = true;
    else if (arg === "--confirm-replace") opts.confirmReplace = true;
    else if (arg === "--publish-drafts") opts.publishDrafts = true;
    else if (arg === "--publish") opts.status = "published";
    else if (arg.startsWith("--package=")) opts.packageDir = path.resolve(arg.slice("--package=".length));
    else if (arg.startsWith("--status=")) opts.status = arg.slice("--status=".length);
    else if (arg.startsWith("--author-email=")) opts.authorEmail = arg.slice("--author-email=".length);
    else if (arg.startsWith("--slug=")) opts.onlySlugs.push(arg.slice("--slug=".length));
    else throw new Error(`Argumen tidak dikenal: ${arg}`);
  }

  return opts;
}

function printHelp() {
  console.log(`TELLU CMS Editorial Package Importer

Penggunaan:
  node scripts/cms-import.mjs [opsi]

Opsi:
  --package=<dir>        Direktori paket editorial (default: content/blog-launch)
  --dry-run              Validasi paket dan tampilkan rencana tanpa menulis database
  --status=<status>      Status target: draft | in_review | published (default: draft)
  --publish              Pintasan untuk --status=published (untuk artikel baru)
  --publish-drafts       Terbitkan draft/in_review ber-slug sama tanpa menimpa isi
  --author-email=<email> Email akun Owner/Editor aktif pelaksana impor
  --slug=<slug>          Impor slug tertentu saja (dapat diulang)
  --replace              Izinkan pembaruan artikel yang sudah ada (wajib bersama --confirm-replace)
  --confirm-replace      Konfirmasi eksplisit untuk memperbarui artikel dengan slug yang sama
  --help, -h             Tampilkan bantuan ini
`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  const db = getDb();
  try {
    const actor = resolveImportActor(db, opts.authorEmail);
    const report = await importEditorialPackage(db, {
      packageDir: opts.packageDir,
      actor,
      targetStatus: opts.status,
      dryRun: opts.dryRun,
      replaceExisting: opts.replace,
      confirmReplace: opts.confirmReplace,
      publishExistingDrafts: opts.publishDrafts,
      onlySlugs: opts.onlySlugs.length > 0 ? opts.onlySlugs : undefined,
    });

    console.log(
      `Paket: ${report.packageId} (v${report.version}) | Mode: ${
        report.dryRun ? "DRY-RUN" : "WRITE"
      } | Status target: ${report.targetStatus} | Pelaksana: ${report.actorEmail}`
    );
    for (const item of report.items) {
      const detail = item.reason ? ` — ${item.reason}` : "";
      const ids = item.postId ? ` [post=${item.postId}${item.mediaId ? `, media=${item.mediaId}` : ""}]` : "";
      console.log(`  [${item.action.toUpperCase()}] ${item.slug}${ids}${detail}`);
    }
    console.log(
      `Ringkasan: created=${report.created}, updated=${report.updated}, skipped=${report.skipped}, failed=${report.failed}`
    );

    if (report.failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    closeDb();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
