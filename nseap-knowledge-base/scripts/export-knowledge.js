/**
 * export-knowledge.js
 *
 * 反向同步：把运行时数据库 data/knowledge-db.json 里的结构化元数据回写到
 * knowledge-base/ 下对应的 Markdown 文件（frontmatter）。
 *
 * 与 import-knowledge.js 合起来构成 DESIGN 9.5 的 V0.3「Markdown + 数据库双向同步」，
 * 也满足第 14 章后端验收第 8/9 条（可导入/导出 Markdown，便于 GitHub review）。
 *
 * 语义：只回写 frontmatter，保留正文
 *   - 只更新 md 顶部 YAML frontmatter（结构化元数据）。
 *   - md 正文（人写的 Purpose/Situation/Workflow 等段落）原样保留，不被覆盖。
 *   - 仅处理 source 指向 knowledge-base/ 且文件存在的条目；上传条目/无源条目跳过。
 *   - archived 条目默认跳过（用 --include-archived 纳入）。
 *
 * 用法：
 *   node scripts/export-knowledge.js            # 回写所有可定位的 knowledge-base 条目
 *   node scripts/export-knowledge.js --dry-run  # 只显示会改哪些文件，不写入
 *   node scripts/export-knowledge.js --id kb-prompt-001   # 只回写指定条目
 */
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const dbPath = path.join(rootDir, "data", "knowledge-db.json");

// frontmatter 里的字段顺序（对齐 knowledge-base/*.md 现有写法）
const SCALAR_FIELDS = ["id", "title", "type"];
const LIST_FIELDS = ["audience", "tags", "keywords", "concepts", "skills", "related"];
const TAIL_SCALAR = ["status"]; // status/updated 放在 relationships 之后

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^﻿/, ""));
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter((v) => v !== undefined && v !== null && String(v).trim() !== "");
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

// audience 中文标签 -> 英文枚举（对齐 DESIGN 8.4：底层统一英文枚举）。
// 运行库里 audience 存的是展示用中文，回写 md 源时要还原成英文枚举。
// 未收录的额外角色（如 FDE / 领域专家）无标准枚举，原样保留。
const AUDIENCE_TO_ENUM = {
  "学生": "student", "教师": "teacher", "老师": "teacher", "Builder": "builder", "Agent": "agent"
};
function toAudienceEnum(values) {
  return normalizeArray(values).map((v) => AUDIENCE_TO_ENUM[String(v).trim()] || v);
}

// 需要引号的标量（含特殊字符时）
function yamlScalar(value) {
  const s = String(value == null ? "" : value);
  if (s === "") return '""';
  if (/[:#\[\]{}&*!|>'"%@`]/.test(s) || /^\s|\s$/.test(s)) {
    return `"${s.replace(/"/g, '\\"')}"`;
  }
  return s;
}

// 把库条目序列化成 frontmatter 文本（不含首尾 ---）
function buildFrontmatter(entry) {
  const lines = [];
  for (const f of SCALAR_FIELDS) {
    if (entry[f] != null && entry[f] !== "") lines.push(`${f}: ${yamlScalar(entry[f])}`);
  }
  for (const f of LIST_FIELDS) {
    const arr = f === "audience" ? toAudienceEnum(entry[f]) : normalizeArray(entry[f]);
    if (arr.length) {
      lines.push(`${f}:`);
      for (const item of arr) lines.push(`  - ${yamlScalar(item)}`);
    }
  }
  const rels = Array.isArray(entry.relationships) ? entry.relationships : [];
  if (rels.length) {
    lines.push("relationships:");
    for (const r of rels) {
      if (!r || !r.predicate) continue;
      lines.push(`  - predicate: ${yamlScalar(r.predicate)}`);
      if (r.target) lines.push(`    target: ${yamlScalar(r.target)}`);
      if (r.targetLabel) lines.push(`    targetLabel: ${yamlScalar(r.targetLabel)}`);
    }
  }
  for (const f of TAIL_SCALAR) {
    if (entry[f] != null && entry[f] !== "") lines.push(`${f}: ${yamlScalar(entry[f])}`);
  }
  // updated 用条目 updatedAt 的日期部分，没有就用今天
  const updated = (entry.updatedAt || new Date().toISOString()).slice(0, 10);
  lines.push(`updated: ${updated}`);
  return lines.join("\n");
}

// 从 source 字段解析出 md 的绝对路径；非 knowledge-base 或不存在则返回 null
function resolveMdPath(entry) {
  const src = entry.source || "";
  if (!src.includes("knowledge-base/")) return null;
  const rel = src.replace(/^\.\.\//, "").replace(/^\//, "");
  const full = path.resolve(rootDir, rel);
  if (!full.endsWith(".md")) return null;
  if (!fs.existsSync(full)) return null;
  return full;
}

// 用新 frontmatter 替换文件顶部 YAML，正文原样保留
function replaceFrontmatter(content, frontmatter) {
  const body = content.startsWith("---")
    ? content.slice(content.indexOf("\n---", 3) + 4).replace(/^\r?\n/, "")
    : content.replace(/^\r?\n*/, "");
  return `---\n${frontmatter}\n---\n\n${body.replace(/\s*$/, "")}\n`;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const includeArchived = process.argv.includes("--include-archived");
  const idIdx = process.argv.indexOf("--id");
  const onlyId = idIdx !== -1 ? process.argv[idIdx + 1] : null;

  const db = readJson(dbPath);
  const entries = Array.isArray(db.entries) ? db.entries : [];

  let written = 0;
  let skipped = 0;
  const writtenFiles = [];
  const skippedReasons = [];

  for (const entry of entries) {
    if (!entry || !entry.id) continue;
    if (onlyId && entry.id !== onlyId) continue;
    if (!includeArchived && entry.status === "archived") { skipped++; continue; }

    const mdPath = resolveMdPath(entry);
    if (!mdPath) { skipped++; skippedReasons.push(`${entry.id}: 无 knowledge-base md 源`); continue; }

    const original = fs.readFileSync(mdPath, "utf8").replace(/^﻿/, "");
    const updated = replaceFrontmatter(original, buildFrontmatter(entry));

    if (original === updated) { skipped++; continue; }

    const relPath = path.relative(rootDir, mdPath);
    if (dryRun) {
      console.log(`  [dry-run] 将更新 ${relPath}`);
    } else {
      fs.writeFileSync(mdPath, updated, "utf8");
      console.log(`  ✓ 已回写 ${relPath}`);
    }
    written++;
    writtenFiles.push(relPath);
  }

  console.log("");
  console.log(dryRun
    ? `dry-run：将回写 ${written} 个文件，跳过 ${skipped} 条`
    : `✓ 回写完成：更新 ${written} 个 md 文件，跳过 ${skipped} 条`);
  if (onlyId && !writtenFiles.length && !dryRun) console.log(`  （${onlyId} 无变化或无 md 源）`);
  if (skippedReasons.length && process.argv.includes("--verbose")) {
    console.log("  跳过明细:"); skippedReasons.forEach((r) => console.log("   -", r));
  }
}

main();
