/**
 * import-knowledge.js
 *
 * 把 knowledge-base/ 下的静态 Markdown 条目导入运行时数据库 data/knowledge-db.json。
 *
 * 背景：构建管线（build:index）会把 knowledge-base/*.md 解析进 app/knowledge-data.json，
 * 但后端 API 运行时读的是 data/knowledge-db.json，两套数据此前不同步，导致正式知识
 * 条目进不了后端。本脚本打通 md -> 运行库 的导入，兼作 V0.3「Markdown 导入」能力。
 *
 * 语义：幂等增量导入
 *   - 库里已存在的 id：保留库版本（可能已带 relationships / chunks / auditLog），不覆盖。
 *   - 库里没有的 id：从构建产物新增。
 *   - extractedText / chunks 交给后端启动时的 migrateAllEntries() 自动回填。
 *
 * --update 模式（Markdown 为源，对齐 DESIGN 9.5）：
 *   - 对之前由本脚本从 knowledge-base 导入的条目（importedFrom==="knowledge-base"），
 *     用最新 md 内容刷新 md 派生字段（title/summary/keywords/concepts/skills/tags/
 *     relationships/related/situation/workflow/... ），
 *     但保留后端运行时生成的字段（chunks/extractedText/auditLog/createdAt/status）。
 *   - 不触碰非 knowledge-base 来源的条目（如手工维护的 sample、上传条目）。
 *
 * 用法：
 *   node scripts/import-knowledge.js            # 先构建再导入（仅新增）
 *   node scripts/import-knowledge.js --no-build # 直接用现有 app/knowledge-data.json 导入
 *   node scripts/import-knowledge.js --update   # 新增 + 刷新已导入条目的 md 内容
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const builtPath = path.join(rootDir, "app", "knowledge-data.json");
const dbPath = path.join(rootDir, "data", "knowledge-db.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^﻿/, ""));
}

function main() {
  const skipBuild = process.argv.includes("--no-build");
  const updateMode = process.argv.includes("--update");
  if (!skipBuild) {
    console.log("→ 先运行 build 生成最新 app/knowledge-data.json ...");
    execSync("node scripts/build-search-index.js", { cwd: rootDir, stdio: "inherit" });
  }

  const built = readJson(builtPath);
  const builtEntries = Array.isArray(built.entries) ? built.entries : [];
  const db = readJson(dbPath);
  if (!Array.isArray(db.entries)) db.entries = [];

  const dbById = new Map(db.entries.map((e) => [e.id, e]));
  const nowIso = new Date().toISOString();

  // 刷新时保留的运行时字段（不被 md 覆盖）
  const PRESERVE = new Set(["chunks", "extractedText", "auditLog", "createdAt", "status", "archivedAt", "importedFrom"]);

  let added = 0;
  let updated = 0;
  const addedIds = [];
  const updatedIds = [];

  for (const entry of builtEntries) {
    if (!entry || !entry.id) continue;
    const existing = dbById.get(entry.id);

    if (!existing) {
      db.entries.push({
        ...entry,
        status: entry.status || "draft",
        createdAt: entry.createdAt || nowIso,
        updatedAt: entry.updatedAt || nowIso,
        importedFrom: "knowledge-base",
      });
      dbById.set(entry.id, entry);
      added += 1;
      addedIds.push(entry.id);
      continue;
    }

    // 仅在 --update 且该条目来自 knowledge-base 时刷新 md 派生字段
    if (updateMode && existing.importedFrom === "knowledge-base") {
      let changed = false;
      for (const [k, v] of Object.entries(entry)) {
        if (PRESERVE.has(k)) continue;
        if (JSON.stringify(existing[k]) !== JSON.stringify(v)) {
          existing[k] = v;
          changed = true;
        }
      }
      if (changed) {
        existing.updatedAt = nowIso;
        updated += 1;
        updatedIds.push(entry.id);
      }
    }
    // 非 update 或非 knowledge-base 来源：保留库版本，不覆盖
  }

  fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  console.log(`✓ 导入完成：新增 ${added} 条${updateMode ? `，刷新 ${updated} 条` : ""}，库内共 ${db.entries.length} 条`);
  if (addedIds.length) console.log("  新增:", addedIds.join(", "));
  if (updatedIds.length) console.log("  刷新:", updatedIds.join(", "));

  // 把最新 JSON 同步进 SQLite 运行时库（若已存在），避免 md 导入后运行库仍是旧数据。
  try {
    const sqlitePath = process.env.KB_SQLITE_PATH
      ? path.resolve(process.env.KB_SQLITE_PATH)
      : path.join(rootDir, "data", "knowledge.db");
    if (fs.existsSync(sqlitePath)) {
      const { KnowledgeStore } = require("../server/store");
      const store = new KnowledgeStore({ sqlitePath, jsonMirrorPath: dbPath, seedJsonPath: dbPath });
      const n = store.reseedFromJson(dbPath);
      store.close();
      console.log(`  已同步进 SQLite 运行时库（${n} 条）。`);
    } else {
      console.log("  提示：SQLite 运行时库尚未创建，后端首次启动会自动从此 JSON 播种。");
    }
  } catch (err) {
    console.log("  ⚠ 同步 SQLite 失败（不影响 JSON 库）：" + err.message);
  }
  console.log("  提示：extractedText / chunks 将在后端下次启动时由 migrateAllEntries() 自动回填。");
}

main();
