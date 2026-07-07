const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const knowledgeDir = path.join(rootDir, "knowledge-base");
const outputPath = path.join(rootDir, "app", "search-index.json");

function walkMarkdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdownFiles(fullPath);
    if (entry.isFile() && entry.name.endsWith(".md")) return [fullPath];
    return [];
  });
}

function parseFrontmatter(content) {
  if (!content.startsWith("---")) return {};
  const end = content.indexOf("\n---", 3);
  if (end === -1) return {};

  const lines = content.slice(3, end).split(/\r?\n/);
  const data = {};
  let currentKey = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(cleanValue(listMatch[1]));
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) continue;

    currentKey = keyMatch[1];
    const value = keyMatch[2].trim();
    data[currentKey] = value ? cleanValue(value) : [];
  }

  return data;
}

function cleanValue(value) {
  return value.replace(/^["']|["']$/g, "").trim();
}

function frontmatterEnd(content) {
  if (!content.startsWith("---")) return 0;
  const end = content.indexOf("\n---", 3);
  return end === -1 ? 0 : end + 4;
}

function sectionHeadings(body) {
  return body
    .split(/\r?\n/)
    .filter((line) => /^#{1,3}\s+/.test(line))
    .map((line) => line.replace(/^#{1,3}\s+/, "").trim())
    .filter(Boolean);
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value) return [value];
  return [];
}

function buildIndexItem(filePath) {
  const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const meta = parseFrontmatter(content);
  const body = content.slice(frontmatterEnd(content));
  const relativePath = path.relative(rootDir, filePath).replaceAll("\\", "/");
  const headings = sectionHeadings(body);
  const fields = [
    meta.id,
    meta.title,
    meta.type,
    ...normalizeArray(meta.audience),
    ...normalizeArray(meta.tags),
    ...normalizeArray(meta.keywords),
    ...normalizeArray(meta.concepts),
    ...normalizeArray(meta.skills),
    ...normalizeArray(meta.related),
    ...headings,
    body
  ];

  return {
    id: meta.id || relativePath,
    title: meta.title || headings[0] || path.basename(filePath, ".md"),
    type: meta.type || "unknown",
    source: `../${relativePath}`,
    tags: normalizeArray(meta.tags),
    keywords: normalizeArray(meta.keywords),
    concepts: normalizeArray(meta.concepts),
    skills: normalizeArray(meta.skills),
    headings,
    searchText: fields.join(" ").replace(/\s+/g, " ").trim()
  };
}

const index = walkMarkdownFiles(knowledgeDir)
  .map(buildIndexItem)
  .sort((a, b) => a.id.localeCompare(b.id));

fs.writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
console.log(`Built ${index.length} search index items -> ${path.relative(rootDir, outputPath)}`);

execFileSync(
  process.execPath,
  [path.join(__dirname, "build-knowledge-data.js")],
  { stdio: "inherit" }
);

execFileSync(
  process.execPath,
  [path.join(__dirname, "build-embedded-data.js")],
  { stdio: "inherit" }
);
