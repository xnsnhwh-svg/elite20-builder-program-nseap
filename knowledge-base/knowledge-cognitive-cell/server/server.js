const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appDir = path.join(rootDir, "app");
const dbPath = path.join(rootDir, "data", "knowledge-db.json");
const runtimeConfigPath = path.join(rootDir, "data", "runtime-config.json");
const uploadDir = path.join(rootDir, "data", "uploads");
const port = Number(process.env.PORT || 8787);
const defaultLlmBaseUrl = "https://api.openai.com/v1";
const defaultLlmModel = "gpt-4o-mini";

const typeMeta = {
  overview: "概览",
  course: "课程",
  challenge: "挑战",
  prompt: "提示词",
  faq: "FAQ",
  "best-practice": "最佳实践",
  project: "项目案例",
  agent: "Agent"
};

const fieldPriority = [
  "keywords",
  "title",
  "type",
  "tags",
  "concepts",
  "skills",
  "audience",
  "summary",
  "searchText"
];

const allowedTypes = new Set([
  "overview",
  "course",
  "challenge",
  "prompt",
  "faq",
  "best-practice",
  "project",
  "agent"
]);

function readDb() {
  return JSON.parse(fs.readFileSync(dbPath, "utf8").replace(/^\uFEFF/, ""));
}

function writeDb(db) {
  fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function readRuntimeConfig() {
  if (!fs.existsSync(runtimeConfigPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(runtimeConfigPath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return {};
  }
}

function writeRuntimeConfig(config) {
  fs.mkdirSync(path.dirname(runtimeConfigPath), { recursive: true });
  fs.writeFileSync(runtimeConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string" && value.trim()) {
    return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function uniqueStrings(values) {
  const result = [];
  const seen = new Set();
  for (const value of values || []) {
    const text = String(value || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function normalizeKnowledgeType(value, fallback = "project") {
  const type = String(value || "").trim();
  return allowedTypes.has(type) ? type : fallback;
}

function searchableText(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(" ");
  return String(value);
}

function matchesTokens(value, tokens) {
  const text = searchableText(value).toLowerCase();
  return text && tokens.every((token) => text.includes(token));
}

function searchEntries(entries, query, category = "all") {
  const scopedEntries = category === "all"
    ? entries
    : entries.filter((entry) => entry.type === category);
  const tokens = String(query || "").toLowerCase().trim().split(/\s+/).filter(Boolean);

  if (!tokens.length) {
    return scopedEntries.map((entry) => ({ entry, matchedFields: [] }));
  }

  const results = scopedEntries
    .map((entry) => {
      const matchedFields = [];
      const typeLabel = typeMeta[entry.type] || entry.type;

      if (matchesTokens(entry.keywords, tokens)) matchedFields.push("keywords");
      if (matchesTokens(entry.title, tokens)) matchedFields.push("title");
      if (matchesTokens([entry.type, typeLabel], tokens)) matchedFields.push("type");
      if (matchesTokens(entry.tags, tokens)) matchedFields.push("tags");
      if (matchesTokens(entry.concepts, tokens)) matchedFields.push("concepts");
      if (matchesTokens(entry.skills, tokens)) matchedFields.push("skills");
      if (matchesTokens(entry.audience, tokens)) matchedFields.push("audience");
      if (matchesTokens(entry.summary, tokens)) matchedFields.push("summary");
      if (matchesTokens(entry.searchText, tokens)) matchedFields.push("searchText");

      return { entry, matchedFields };
    })
    .filter((result) => result.matchedFields.length);

  return results.sort((a, b) => {
    const aRank = Math.min(...a.matchedFields.map((field) => fieldPriority.indexOf(field)));
    const bRank = Math.min(...b.matchedFields.map((field) => fieldPriority.indexOf(field)));
    if (aRank !== bRank) return aRank - bRank;
    if (b.matchedFields.length !== a.matchedFields.length) {
      return b.matchedFields.length - a.matchedFields.length;
    }
    return a.entry.title.localeCompare(b.entry.title, "zh-CN");
  });
}

function sanitizeEntry(raw) {
  const title = String(raw.title || "").trim();
  const type = String(raw.type || "project").trim();
  if (!title) {
    const error = new Error("title is required");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const id = String(raw.id || `kb-${type}-${Date.now()}`).trim();
  const keywords = normalizeArray(raw.keywords);
  const tags = normalizeArray(raw.tags);
  const concepts = normalizeArray(raw.concepts);
  const skills = normalizeArray(raw.skills);
  const audience = normalizeArray(raw.audience);
  const relationships = Array.isArray(raw.relationships) ? raw.relationships : [];

  return {
    id,
    title,
    type,
    status: String(raw.status || "draft"),
    audience,
    tags,
    keywords,
    concepts,
    skills,
    related: normalizeArray(raw.related),
    relationships,
    summary: String(raw.summary || ""),
    situation: String(raw.situation || ""),
    ontology: String(raw.ontology || ""),
    workflow: String(raw.workflow || ""),
    skill: String(raw.skill || ""),
    evaluation: String(raw.evaluation || ""),
    knowledgeGrowth: String(raw.knowledgeGrowth || ""),
    source: String(raw.source || "api-created"),
    searchText: [
      title,
      type,
      ...audience,
      ...tags,
      ...keywords,
      ...concepts,
      ...skills,
      raw.summary,
      raw.situation,
      raw.ontology,
      raw.workflow,
      raw.searchText
    ].filter(Boolean).join(" "),
    metadataGeneratedBy: String(raw.metadataGeneratedBy || "manual"),
    analysisStatus: String(raw.analysisStatus || ""),
    analysisNote: String(raw.analysisNote || ""),
    analysisConfidence: typeof raw.analysisConfidence === "number" ? raw.analysisConfidence : null,
    createdAt: raw.createdAt || now,
    updatedAt: now
  };
}

function buildSearchText(entry) {
  return [
    entry.id,
    entry.title,
    entry.type,
    entry.status,
    ...normalizeArray(entry.audience),
    ...normalizeArray(entry.tags),
    ...normalizeArray(entry.keywords),
    ...normalizeArray(entry.concepts),
    ...normalizeArray(entry.skills),
    ...normalizeArray(entry.related),
    entry.summary,
    entry.situation,
    entry.ontology,
    entry.workflow,
    entry.skill,
    entry.evaluation,
    entry.knowledgeGrowth,
    entry.source,
    entry.metadataGeneratedBy,
    entry.analysisStatus,
    entry.analysisNote
  ].filter(Boolean).join(" ");
}

function safeFileName(fileName) {
  const baseName = path.basename(String(fileName || "upload.txt"));
  const cleaned = baseName.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 90);
  return cleaned || "upload.txt";
}

function titleFromFileName(fileName) {
  return path.basename(String(fileName || "上传文件"), path.extname(String(fileName || "")))
    .replace(/[_-]+/g, " ")
    .trim() || "上传文件";
}

function inferKnowledgeType(fileName, text) {
  const value = `${fileName || ""} ${text || ""}`.toLowerCase();
  if (value.includes("challenge") || value.includes("挑战")) return "challenge";
  if (value.includes("prompt") || value.includes("提示词")) return "prompt";
  if (value.includes("faq") || value.includes("问答")) return "faq";
  if (value.includes("course") || value.includes("week") || value.includes("课程")) return "course";
  if (value.includes("practice") || value.includes("最佳实践")) return "best-practice";
  if (value.includes("agent")) return "agent";
  return "project";
}

function cleanBaseUrl(value, fallback = defaultLlmBaseUrl) {
  const text = String(value || "").trim();
  return (text || fallback).replace(/\/+$/, "");
}

function llmSettings() {
  const config = readRuntimeConfig();
  const runtime = config.llm && typeof config.llm === "object" ? config.llm : {};
  const envApiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";
  const runtimeApiKey = typeof runtime.apiKey === "string" ? runtime.apiKey.trim() : "";
  const apiKey = runtimeApiKey || envApiKey || "";
  const baseUrl = cleanBaseUrl(
    runtime.baseUrl,
    process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || defaultLlmBaseUrl
  );
  const model = String(runtime.model || process.env.LLM_MODEL || process.env.OPENAI_MODEL || defaultLlmModel).trim() || defaultLlmModel;

  return {
    enabled: Boolean(apiKey),
    apiKey,
    baseUrl,
    model,
    apiKeySource: runtimeApiKey ? "runtime" : (envApiKey ? "env" : "none")
  };
}

function publicSettings() {
  const settings = llmSettings();
  return {
    llm: {
      enabled: settings.enabled,
      apiKeyConfigured: settings.enabled,
      apiKeySource: settings.apiKeySource,
      baseUrl: settings.baseUrl,
      model: settings.model
    }
  };
}

function updateRuntimeSettings(payload) {
  const config = readRuntimeConfig();
  const next = {
    ...config,
    llm: {
      ...(config.llm && typeof config.llm === "object" ? config.llm : {})
    }
  };

  const llm = payload && typeof payload.llm === "object" ? payload.llm : {};
  if (Object.prototype.hasOwnProperty.call(llm, "baseUrl")) {
    next.llm.baseUrl = cleanBaseUrl(llm.baseUrl);
  }
  if (Object.prototype.hasOwnProperty.call(llm, "model")) {
    next.llm.model = String(llm.model || "").trim() || defaultLlmModel;
  }
  if (Object.prototype.hasOwnProperty.call(llm, "apiKey")) {
    const apiKey = String(llm.apiKey || "").trim();
    if (apiKey) next.llm.apiKey = apiKey;
  }
  if (llm.clearApiKey === true) {
    delete next.llm.apiKey;
  }

  writeRuntimeConfig(next);
  return publicSettings();
}

function parseJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeLlmAnalysis(value) {
  const data = value && typeof value === "object" ? value : {};
  const type = normalizeKnowledgeType(data.type, "project");
  return {
    title: String(data.title || "").trim(),
    type,
    summary: String(data.summary || "").trim(),
    audience: normalizeArray(data.audience),
    tags: normalizeArray(data.tags),
    keywords: normalizeArray(data.keywords),
    concepts: normalizeArray(data.concepts),
    skills: normalizeArray(data.skills),
    situation: String(data.situation || "").trim(),
    ontology: String(data.ontology || "").trim(),
    workflow: String(data.workflow || "").trim(),
    skill: String(data.skill || "").trim(),
    evaluation: String(data.evaluation || "").trim(),
    knowledgeGrowth: String(data.knowledgeGrowth || "").trim(),
    confidence: Number.isFinite(Number(data.confidence)) ? Math.max(0, Math.min(1, Number(data.confidence))) : null
  };
}

function ruleAnalysis(payload) {
  const fileName = payload.fileName || "";
  const text = payload.text || "";
  const title = titleFromFileName(fileName);
  const type = inferKnowledgeType(fileName, text);
  const textPreview = extractTextPreview(text);
  const extension = path.extname(String(fileName || "")).replace(".", "");

  return {
    title,
    type,
    summary: textPreview || `由上传文件 ${fileName || "未命名文件"} 自动生成的知识草稿，后续需要补充 metadata。`,
    audience: ["Builder", "Agent"],
    tags: ["uploaded-file", extension || "file"].filter(Boolean),
    keywords: [title, fileName, extension, "上传文件", "知识草稿"].filter(Boolean),
    concepts: [],
    skills: [],
    situation: "用于把学生、老师或 Builder 提交的原始资料先纳入知识库，形成可继续整理的草稿。",
    ontology: "原始文件 -> 知识草稿 -> metadata 标注 -> 审核 -> 正式知识条目。",
    workflow: "上传文件 -> 后端保存文件 -> 自动生成 draft 条目 -> 人工补充分类、关键词、概念和关系 -> 审核发布。",
    skill: "资料归档、metadata 标注、知识整理、审核发布。",
    evaluation: "文件是否保存成功，草稿是否能被搜索到，后续 metadata 是否补充完整。",
    knowledgeGrowth: "上传资料经过整理和审核后，可以沉淀为课程、挑战、项目案例、FAQ、最佳实践或 Agent 上下文。",
    confidence: 0.25
  };
}

async function analyzeUploadWithLlm(payload) {
  const settings = llmSettings();
  const text = String(payload.text || "").trim().slice(0, 8000);
  const fallback = ruleAnalysis(payload);

  if (!text) {
    return {
      ...fallback,
      metadataGeneratedBy: "rule",
      analysisStatus: "needs-text-extraction",
      analysisNote: "当前文件没有可读取正文，通常是 docx/pdf 等二进制文件；已先按文件名生成草稿，后续可补充 metadata。"
    };
  }

  if (!settings.enabled) {
    return {
      ...fallback,
      metadataGeneratedBy: "rule",
      analysisStatus: "llm-disabled",
      analysisNote: "未配置 LLM_API_KEY，已使用规则兜底生成草稿；配置 Key 后上传会自动调用 LLM 分类。"
    };
  }

  const prompt = [
    "你是 NSEAP Knowledge Cognitive Cell 的知识整理助手。",
    "请根据上传文件正文，生成一个知识草稿的 metadata。",
    "只能返回 JSON，不要返回 Markdown。",
    "type 必须是 overview/course/challenge/prompt/faq/best-practice/project/agent 之一。",
    "audience、tags、keywords、concepts、skills 必须是数组。",
    "summary 用中文，一句话说明资料解决什么问题。",
    "confidence 是 0 到 1 的数字。",
    "",
    `文件名：${payload.fileName || "未命名文件"}`,
    "文件正文：",
    text
  ].join("\n");

  try {
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "你负责把课程、挑战、项目案例、FAQ、最佳实践和 Agent 上下文整理成结构化知识 metadata。"
          },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `LLM request failed: ${response.status}`);
    }

    const content = data.choices?.[0]?.message?.content || "";
    const parsed = parseJsonObject(content);
    const analysis = normalizeLlmAnalysis(parsed);
    const merged = {
      ...fallback,
      ...Object.fromEntries(Object.entries(analysis).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== "" && value !== null;
      }))
    };

    return {
      ...merged,
      metadataGeneratedBy: "llm",
      analysisStatus: "llm-analyzed",
      analysisNote: `已使用 ${settings.model} 自动分析正文并生成 metadata。`,
      confidence: analysis.confidence ?? 0.7
    };
  } catch (error) {
    return {
      ...fallback,
      metadataGeneratedBy: "rule",
      analysisStatus: "llm-failed",
      analysisNote: `LLM 分析失败，已使用规则兜底生成草稿：${error.message || "unknown error"}`
    };
  }
}

function extractTextPreview(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:.*?;base64,(.+)$/);
  return match ? Buffer.from(match[1], "base64") : null;
}

function buildUploadEntry(payload, storedName, relativeSource, analysis) {
  const inferred = analysis || ruleAnalysis(payload);
  const title = String(payload.title || inferred.title || titleFromFileName(payload.fileName)).trim();
  const textPreview = extractTextPreview(payload.text);
  const type = normalizeKnowledgeType(payload.type || inferred.type || inferKnowledgeType(payload.fileName, payload.text));
  const extension = path.extname(String(payload.fileName || "")).replace(".", "");
  const keywords = uniqueStrings([...normalizeArray(payload.keywords), ...normalizeArray(inferred.keywords)]);
  const now = new Date().toISOString();

  return sanitizeEntry({
    id: `kb-upload-${Date.now()}`,
    title,
    type,
    status: "draft",
    audience: uniqueStrings([...normalizeArray(inferred.audience), "Builder", "Agent"]),
    tags: uniqueStrings(["uploaded-file", extension || "file", ...normalizeArray(inferred.tags)]),
    keywords: uniqueStrings([title, payload.fileName, extension, "上传文件", "知识草稿", ...keywords]),
    concepts: normalizeArray(inferred.concepts),
    skills: normalizeArray(inferred.skills),
    related: [],
    relationships: [],
    summary: inferred.summary || textPreview || `由上传文件 ${payload.fileName || storedName} 自动生成的知识草稿，后续需要补充 metadata。`,
    situation: inferred.situation,
    ontology: inferred.ontology,
    workflow: inferred.workflow,
    skill: inferred.skill,
    evaluation: inferred.evaluation,
    knowledgeGrowth: inferred.knowledgeGrowth,
    source: relativeSource,
    searchText: `${title} ${payload.fileName || ""} 上传文件 知识草稿 ${textPreview}`,
    metadataGeneratedBy: inferred.metadataGeneratedBy || "rule",
    analysisStatus: inferred.analysisStatus || "rule-fallback",
    analysisNote: inferred.analysisNote || "已使用规则生成草稿。",
    analysisConfidence: inferred.confidence,
    createdAt: now,
    updatedAt: now
  });
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon"
  }[ext] || "application/octet-stream";
}

function serveUpload(req, res, pathname) {
  const relative = decodeURIComponent(pathname.replace(/^\/uploads\/?/, ""));
  const candidate = path.resolve(uploadDir, relative);
  if (!candidate.startsWith(uploadDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(candidate, (error, content) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentTypeFor(candidate) });
    res.end(content);
  });
}

function serveStatic(req, res, pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  const candidate = path.resolve(appDir, `.${decodeURIComponent(cleanPath)}`);
  if (!candidate.startsWith(appDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(candidate, (error, content) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentTypeFor(candidate) });
    res.end(content);
  });
}

async function handleApi(req, res, url) {
  const db = readDb();

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      service: "nseap-knowledge-base",
      entries: db.entries.length,
      llmEnabled: llmSettings().enabled
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/llm/status") {
    const settings = llmSettings();
    sendJson(res, 200, {
      enabled: settings.enabled,
      apiKeyConfigured: settings.enabled,
      apiKeySource: settings.apiKeySource,
      model: settings.enabled ? settings.model : null,
      baseUrl: settings.enabled ? settings.baseUrl : null,
      note: settings.enabled
        ? "LLM metadata analysis is enabled."
        : "LLM_API_KEY or OPENAI_API_KEY is not configured; upload uses rule fallback."
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/settings") {
    sendJson(res, 200, publicSettings());
    return;
  }

  if ((req.method === "PATCH" || req.method === "POST") && url.pathname === "/api/settings") {
    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    sendJson(res, 200, updateRuntimeSettings(payload));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/knowledge") {
    sendJson(res, 200, db);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/search") {
    const query = url.searchParams.get("q") || "";
    const category = url.searchParams.get("category") || "all";
    const results = searchEntries(db.entries, query, category);
    sendJson(res, 200, {
      query,
      category,
      count: results.length,
      results: results.map(({ entry, matchedFields }) => ({ ...entry, matchedFields }))
    });
    return;
  }

  const detailMatch = url.pathname.match(/^\/api\/knowledge\/([^/]+)$/);
  if (req.method === "GET" && detailMatch) {
    const id = decodeURIComponent(detailMatch[1]);
    const entry = db.entries.find((item) => item.id === id);
    if (!entry) {
      sendJson(res, 404, { error: "Knowledge entry not found" });
      return;
    }
    sendJson(res, 200, entry);
    return;
  }

  if (req.method === "PATCH" && detailMatch) {
    const id = decodeURIComponent(detailMatch[1]);
    const index = db.entries.findIndex((item) => item.id === id);
    if (index === -1) {
      sendJson(res, 404, { error: "Knowledge entry not found" });
      return;
    }

    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    const current = db.entries[index];
    const updated = {
      ...current,
      title: payload.title !== undefined ? String(payload.title || current.title).trim() : current.title,
      type: payload.type !== undefined ? String(payload.type || current.type).trim() : current.type,
      status: payload.status !== undefined ? String(payload.status || current.status).trim() : current.status,
      audience: payload.audience !== undefined ? normalizeArray(payload.audience) : normalizeArray(current.audience),
      tags: payload.tags !== undefined ? normalizeArray(payload.tags) : normalizeArray(current.tags),
      keywords: payload.keywords !== undefined ? normalizeArray(payload.keywords) : normalizeArray(current.keywords),
      concepts: payload.concepts !== undefined ? normalizeArray(payload.concepts) : normalizeArray(current.concepts),
      skills: payload.skills !== undefined ? normalizeArray(payload.skills) : normalizeArray(current.skills),
      related: payload.related !== undefined ? normalizeArray(payload.related) : normalizeArray(current.related),
      relationships: Array.isArray(payload.relationships) ? payload.relationships : (Array.isArray(current.relationships) ? current.relationships : []),
      summary: payload.summary !== undefined ? String(payload.summary || "") : current.summary,
      situation: payload.situation !== undefined ? String(payload.situation || "") : current.situation,
      ontology: payload.ontology !== undefined ? String(payload.ontology || "") : current.ontology,
      workflow: payload.workflow !== undefined ? String(payload.workflow || "") : current.workflow,
      skill: payload.skill !== undefined ? String(payload.skill || "") : current.skill,
      evaluation: payload.evaluation !== undefined ? String(payload.evaluation || "") : current.evaluation,
      knowledgeGrowth: payload.knowledgeGrowth !== undefined ? String(payload.knowledgeGrowth || "") : current.knowledgeGrowth,
      updatedAt: new Date().toISOString()
    };

    updated.searchText = buildSearchText(updated);
    db.entries[index] = updated;
    writeDb(db);
    sendJson(res, 200, updated);
    return;
  }

  if (req.method === "DELETE" && detailMatch) {
    const id = decodeURIComponent(detailMatch[1]);
    const index = db.entries.findIndex((item) => item.id === id);
    if (index === -1) {
      sendJson(res, 404, { error: "Knowledge entry not found" });
      return;
    }

    const [deleted] = db.entries.splice(index, 1);
    writeDb(db);
    sendJson(res, 200, {
      deleted: {
        id: deleted.id,
        title: deleted.title,
        type: deleted.type
      },
      countDelta: -1,
      remaining: db.entries.length
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/knowledge") {
    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    const entry = sanitizeEntry(payload);
    const existingIndex = db.entries.findIndex((item) => item.id === entry.id);

    if (existingIndex >= 0) db.entries[existingIndex] = entry;
    else db.entries.push(entry);

    writeDb(db);
    sendJson(res, existingIndex >= 0 ? 200 : 201, entry);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/upload") {
    const body = await readRequestBody(req);
    const payload = body ? JSON.parse(body) : {};
    const fileName = safeFileName(payload.fileName);
    const storedName = `${Date.now()}-${fileName}`;
    const targetPath = path.resolve(uploadDir, storedName);

    if (!targetPath.startsWith(uploadDir)) {
      sendJson(res, 400, { error: "Invalid file name" });
      return;
    }

    fs.mkdirSync(uploadDir, { recursive: true });

    const binary = decodeDataUrl(payload.dataUrl);
    if (binary) fs.writeFileSync(targetPath, binary);
    else fs.writeFileSync(targetPath, String(payload.text || ""), "utf8");

    const source = `/uploads/${encodeURIComponent(storedName)}`;
    const analysis = await analyzeUploadWithLlm(payload);
    const entry = buildUploadEntry(payload, storedName, source, analysis);
    db.entries.push(entry);
    writeDb(db);

    sendJson(res, 201, {
      file: {
        originalName: payload.fileName || fileName,
        storedName,
        source,
        size: Number(payload.fileSize || 0)
      },
      entry
    });
    return;
  }

  sendJson(res, 404, { error: "API route not found" });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);

  if (url.pathname.startsWith("/uploads/")) {
    serveUpload(req, res, url.pathname);
    return;
  }

  if (!url.pathname.startsWith("/api/")) {
    serveStatic(req, res, url.pathname);
    return;
  }

  handleApi(req, res, url).catch((error) => {
    sendJson(res, error.statusCode || 500, { error: error.message || "Internal server error" });
  });
});

server.listen(port, () => {
  console.log(`NSEAP Knowledge Base MVP running at http://127.0.0.1:${port}`);
});
