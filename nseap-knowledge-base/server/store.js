"use strict";

/**
 * SQLite 存储层（对齐 DESIGN.md 9.2）
 * ------------------------------------------------------------------
 * 设计要点：
 * 1. 运行时唯一真源 = SQLite（node:sqlite 内置，零第三方依赖）。
 * 2. 每条 KnowledgeItem 的完整 JSON 存 doc_json 列 —— 保证与旧 JSON 库
 *    byte 级往返无损，server.js 的 readDb/writeDb 对象结构不变，API 契约不动。
 * 3. 同时把 DESIGN 9.2 列出的字段拆成真实列 + 多值子表 + 关系表，供 SQL 查询。
 * 4. knowledge_revisions：每次内容哈希变化落一条修订，自动积累历史。
 * 5. knowledge-db.json 降级为「自动生成的镜像」，仍留在 git 里供 review/导出。
 *
 * 环境变量：
 *   KB_SQLITE_PATH  SQLite 文件路径（默认 data/knowledge.db；测试指向临时文件）
 *   KB_DB_PATH      JSON 镜像路径（默认 data/knowledge-db.json）
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

const MULTI_FIELDS = ["audience", "tags", "keywords", "concepts", "skills"];

// DESIGN 8.3 主内容字段 -> knowledge_items 真实列（其余字段进 doc_json 保真）
const SCALAR_COLUMNS = [
  "title", "type", "status", "summary", "source",
  "situation", "ontology", "workflow", "skill",
  "evaluation", "knowledgeGrowth", "createdAt", "updatedAt"
];

function hashDoc(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

function schemaSql() {
  return `
    CREATE TABLE IF NOT EXISTS db_singletons (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS knowledge_items (
      id               TEXT PRIMARY KEY,
      title            TEXT,
      type             TEXT,
      status           TEXT,
      summary          TEXT,
      source           TEXT,
      situation        TEXT,
      ontology         TEXT,
      workflow         TEXT,
      skill            TEXT,
      evaluation       TEXT,
      knowledge_growth TEXT,
      created_at       TEXT,
      updated_at       TEXT,
      seq              INTEGER,
      doc_json         TEXT NOT NULL,
      content_hash     TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS knowledge_item_values (
      item_id TEXT NOT NULL,
      field   TEXT NOT NULL,
      value   TEXT NOT NULL,
      ord     INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_kiv_item ON knowledge_item_values(item_id);
    CREATE INDEX IF NOT EXISTS idx_kiv_field ON knowledge_item_values(field, value);
    CREATE TABLE IF NOT EXISTS knowledge_relationships (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      source_item_id TEXT NOT NULL,
      predicate      TEXT NOT NULL,
      target_item_id TEXT,
      target_label   TEXT,
      note           TEXT,
      ord            INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rel_source ON knowledge_relationships(source_item_id);
    CREATE TABLE IF NOT EXISTS knowledge_revisions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id      TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      status       TEXT,
      doc_json     TEXT NOT NULL,
      created_at   TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rev_item ON knowledge_revisions(item_id, id);
  `;
}

class KnowledgeStore {
  constructor({ sqlitePath, jsonMirrorPath, seedJsonPath } = {}) {
    this.sqlitePath = sqlitePath;
    this.jsonMirrorPath = jsonMirrorPath;
    this.seedJsonPath = seedJsonPath || jsonMirrorPath;
    if (this.sqlitePath !== ":memory:") {
      fs.mkdirSync(path.dirname(this.sqlitePath), { recursive: true });
    }
    this.db = new DatabaseSync(this.sqlitePath);
    this.db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    this.db.exec(schemaSql());
    this._seedIfEmpty();
  }

  _rowCount() {
    return this.db.prepare("SELECT COUNT(*) AS n FROM knowledge_items").get().n;
  }

  // 首次启动：库空则从 JSON 种子导入（沿用现有 knowledge-db.json）
  _seedIfEmpty() {
    if (this._rowCount() > 0) return;
    let seed = null;
    if (this.seedJsonPath && fs.existsSync(this.seedJsonPath)) {
      try {
        seed = JSON.parse(fs.readFileSync(this.seedJsonPath, "utf8").replace(/^﻿/, ""));
      } catch {
        seed = null;
      }
    }
    if (!seed || !Array.isArray(seed.entries)) {
      seed = { meta: {}, categories: [], flow: [], entries: [] };
    }
    this.saveDb(seed, { seeding: true });
  }

  _setSingleton(key, value) {
    this.db.prepare(
      "INSERT INTO db_singletons(key, value) VALUES(?, ?) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(key, JSON.stringify(value ?? null));
  }

  _getSingleton(key, fallback) {
    const row = this.db.prepare("SELECT value FROM db_singletons WHERE key = ?").get(key);
    if (!row) return fallback;
    try {
      return JSON.parse(row.value);
    } catch {
      return fallback;
    }
  }

  /**
   * 从 SQLite 重建出与旧 JSON 库结构完全一致的对象。
   * 每条 entry 直接用 doc_json 反序列化 -> 保证 byte 级无损、字段顺序稳定。
   */
  loadDb() {
    const rows = this.db
      .prepare("SELECT doc_json FROM knowledge_items ORDER BY seq ASC, id ASC")
      .all();
    const entries = rows.map((r) => JSON.parse(r.doc_json));
    return {
      meta: this._getSingleton("meta", {}),
      categories: this._getSingleton("categories", []),
      flow: this._getSingleton("flow", []),
      entries
    };
  }

  /**
   * 把完整 db 对象落盘：写单例(meta/categories/flow) + 逐条 upsert entry。
   * - 内容哈希变化时向 knowledge_revisions 追加一条修订快照
   * - 删除已不存在的条目（server 端 archive 是改 status，不会走到这里删）
   * - 回写 JSON 镜像（seeding 时跳过，避免覆盖种子源）
   */
  saveDb(db, { seeding = false } = {}) {
    const entries = Array.isArray(db.entries) ? db.entries : [];
    const now = new Date().toISOString();

    const tx = this.db.prepare("SELECT 1"); // 占位，实际用 exec 包裹事务
    this.db.exec("BEGIN");
    try {
      this._setSingleton("meta", db.meta || {});
      this._setSingleton("categories", db.categories || []);
      this._setSingleton("flow", db.flow || []);

      const keepIds = new Set();
      entries.forEach((entry, index) => {
        if (!entry || !entry.id) return;
        keepIds.add(entry.id);
        this._upsertEntry(entry, index, now);
      });

      // 清理已从对象中移除的条目
      const existing = this.db.prepare("SELECT id FROM knowledge_items").all();
      for (const { id } of existing) {
        if (!keepIds.has(id)) this._deleteEntry(id);
      }

      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
    void tx;

    if (!seeding) this._writeJsonMirror(db);
  }

  _deleteEntry(id) {
    this.db.prepare("DELETE FROM knowledge_item_values WHERE item_id = ?").run(id);
    this.db.prepare("DELETE FROM knowledge_relationships WHERE source_item_id = ?").run(id);
    this.db.prepare("DELETE FROM knowledge_items WHERE id = ?").run(id);
  }

  _upsertEntry(entry, index, now) {
    const docJson = JSON.stringify(entry);
    const contentHash = hashDoc(entry);
    const prev = this.db
      .prepare("SELECT content_hash FROM knowledge_items WHERE id = ?")
      .get(entry.id);

    const scalars = SCALAR_COLUMNS.map((k) => (entry[k] == null ? null : String(entry[k])));
    this.db.prepare(
      `INSERT INTO knowledge_items
         (id, title, type, status, summary, source, situation, ontology, workflow,
          skill, evaluation, knowledge_growth, created_at, updated_at, seq, doc_json, content_hash)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title, type=excluded.type, status=excluded.status,
         summary=excluded.summary, source=excluded.source, situation=excluded.situation,
         ontology=excluded.ontology, workflow=excluded.workflow, skill=excluded.skill,
         evaluation=excluded.evaluation, knowledge_growth=excluded.knowledge_growth,
         created_at=excluded.created_at, updated_at=excluded.updated_at,
         seq=excluded.seq, doc_json=excluded.doc_json, content_hash=excluded.content_hash`
    ).run(entry.id, ...scalars, index, docJson, contentHash);

    // 多值子表：先清后插，保持顺序
    this.db.prepare("DELETE FROM knowledge_item_values WHERE item_id = ?").run(entry.id);
    const insVal = this.db.prepare(
      "INSERT INTO knowledge_item_values(item_id, field, value, ord) VALUES(?,?,?,?)"
    );
    for (const field of MULTI_FIELDS) {
      const arr = Array.isArray(entry[field]) ? entry[field] : [];
      arr.forEach((v, ord) => {
        if (v != null && String(v).trim()) insVal.run(entry.id, field, String(v), ord);
      });
    }

    // 关系表：先清后插
    this.db.prepare("DELETE FROM knowledge_relationships WHERE source_item_id = ?").run(entry.id);
    const insRel = this.db.prepare(
      "INSERT INTO knowledge_relationships(source_item_id, predicate, target_item_id, target_label, note, ord) VALUES(?,?,?,?,?,?)"
    );
    const rels = Array.isArray(entry.relationships) ? entry.relationships : [];
    rels.forEach((rel, ord) => {
      if (!rel || !rel.predicate) return;
      insRel.run(
        entry.id,
        String(rel.predicate),
        rel.target != null ? String(rel.target) : null,
        rel.targetLabel != null ? String(rel.targetLabel) : null,
        rel.note != null ? String(rel.note) : null,
        ord
      );
    });

    // 修订历史：内容哈希变化才落一条（含首次插入）
    if (!prev || prev.content_hash !== contentHash) {
      this.db.prepare(
        "INSERT INTO knowledge_revisions(item_id, content_hash, status, doc_json, created_at) VALUES(?,?,?,?,?)"
      ).run(entry.id, contentHash, entry.status || null, docJson, now);
    }
  }

  /**
   * 从 JSON 镜像重建 SQLite（保留修订历史）。
   * 用于 import-knowledge.js 把新 md 内容并入 JSON 后，同步进运行时库。
   * 只清空 items/values/relationships，不动 knowledge_revisions —— 历史累积不丢。
   */
  reseedFromJson(jsonPath) {
    const src = jsonPath || this.seedJsonPath || this.jsonMirrorPath;
    let data = null;
    if (src && fs.existsSync(src)) {
      data = JSON.parse(fs.readFileSync(src, "utf8").replace(/^﻿/, ""));
    }
    if (!data || !Array.isArray(data.entries)) {
      throw new Error(`reseed 源无效: ${src}`);
    }
    this.db.exec("DELETE FROM knowledge_item_values; DELETE FROM knowledge_relationships; DELETE FROM knowledge_items;");
    // seeding:true 跳过镜像回写（源就是镜像本身），但仍会为变化的内容记修订
    this.saveDb(data, { seeding: true });
    return data.entries.length;
  }

  // 查询某条目的修订历史（新 -> 旧）
  listRevisions(itemId, limit = 50) {
    return this.db
      .prepare(
        "SELECT id, content_hash, status, created_at FROM knowledge_revisions " +
        "WHERE item_id = ? ORDER BY id DESC LIMIT ?"
      )
      .all(itemId, limit)
      .map((r) => ({
        revisionId: r.id,
        contentHash: r.content_hash,
        status: r.status,
        createdAt: r.created_at
      }));
  }

  _writeJsonMirror(db) {
    if (!this.jsonMirrorPath) return;
    fs.mkdirSync(path.dirname(this.jsonMirrorPath), { recursive: true });
    fs.writeFileSync(this.jsonMirrorPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  }

  close() {
    try { this.db.close(); } catch { /* noop */ }
  }
}

module.exports = { KnowledgeStore };

