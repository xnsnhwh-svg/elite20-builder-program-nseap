const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const rootDir = path.resolve(__dirname, "..");
const dbPath = path.join(rootDir, "data", "knowledge-db.json");
const port = 18987;
const baseUrl = `http://127.0.0.1:${port}`;

function isolatedServerEnv(t, overrides = {}) {
  const configDir = fs.mkdtempSync(path.join(os.tmpdir(), "nseap-kb-test-"));
  t.after(() => fs.rmSync(configDir, { recursive: true, force: true }));
  return {
    ...process.env,
    PORT: String(port),
    RUNTIME_CONFIG_PATH: path.join(configDir, "runtime-config.json"),
    ...overrides
  };
}

function dataUrl(buffer, mimeType = "application/octet-stream") {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function makeStoredZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [fileName, content] of entries) {
    const name = Buffer.from(fileName);
    const data = Buffer.from(content);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(0, 10);
    local.writeUInt32LE(0, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(0, 12);
    central.writeUInt32LE(0, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt32LE(0, 34);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const centralSize = centralParts.reduce((size, part) => size + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function minimalDocx(text) {
  return makeStoredZip([
    [
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`
    ]
  ]);
}

function minimalPdf(text) {
  return Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${text.length + 27} >>
stream
BT /F1 12 Tf 72 720 Td (${text}) Tj ET
endstream
endobj
trailer
<< /Root 1 0 R >>
%%EOF`, "utf8");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readHttpBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function startFakeLlmServer(t, handler) {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/chat/completions") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "not found" } }));
      return;
    }

    const rawBody = await readHttpBody(req);
    const body = rawBody ? JSON.parse(rawBody) : {};
    requests.push(body);
    const content = handler(body);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      choices: [
        {
          message: {
            role: "assistant",
            content: typeof content === "string" ? content : JSON.stringify(content)
          }
        }
      ]
    }));
  });

  t.after(() => server.close());

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        requests
      });
    });
  });
}

async function waitForHealth() {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      await delay(100);
    }
  }
  throw new Error("server did not become healthy");
}

test("settings API saves LLM config without exposing the API key", async (t) => {
  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: isolatedServerEnv(t, {
      LLM_API_KEY: "",
      OPENAI_API_KEY: "",
      LLM_BASE_URL: "",
      OPENAI_BASE_URL: "",
      LLM_MODEL: "",
      OPENAI_MODEL: ""
    }),
    stdio: "pipe"
  });

  t.after(() => {
    child.kill();
  });

  await waitForHealth();

  const initial = await fetch(`${baseUrl}/api/settings`);
  assert.equal(initial.status, 200);
  const initialBody = await initial.json();
  assert.equal(Object.prototype.hasOwnProperty.call(initialBody.llm, "apiKey"), false);

  const saved = await fetch(`${baseUrl}/api/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      llm: {
        baseUrl: "https://example.test/v1/",
        model: "demo-model-v1",
        apiKey: "secret-key-for-test"
      }
    })
  });
  assert.equal(saved.status, 200);

  const savedBody = await saved.json();
  assert.equal(savedBody.llm.baseUrl, "https://example.test/v1");
  assert.equal(savedBody.llm.model, "demo-model-v1");
  assert.equal(savedBody.llm.enabled, true);
  assert.equal(savedBody.llm.apiKeyConfigured, true);
  assert.equal(Object.prototype.hasOwnProperty.call(savedBody.llm, "apiKey"), false);

  const status = await fetch(`${baseUrl}/api/llm/status`);
  assert.equal(status.status, 200);
  const statusBody = await status.json();
  assert.equal(statusBody.enabled, true);
  assert.equal(statusBody.model, "demo-model-v1");
  assert.equal(statusBody.baseUrl, "https://example.test/v1");
  assert.equal(Object.prototype.hasOwnProperty.call(statusBody, "apiKey"), false);
});

test("knowledge API archives an entry and hides it from default search", async (t) => {
  const backup = fs.readFileSync(dbPath, "utf8");

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: isolatedServerEnv(t),
    stdio: "pipe"
  });

  t.after(() => {
    child.kill();
    fs.writeFileSync(dbPath, backup, "utf8");
  });

  await waitForHealth();

  const id = `kb-delete-test-${Date.now()}`;
  const createResponse = await fetch(`${baseUrl}/api/knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      title: "删除测试知识",
      type: "project",
      status: "draft",
      keywords: ["delete-test-keyword", "删除测试", "临时条目"],
      summary: "用于验证删除知识条目的临时数据。"
    })
  });
  assert.equal(createResponse.status, 201);

  const deleteResponse = await fetch(`${baseUrl}/api/knowledge/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
  assert.equal(deleteResponse.status, 200);
  const deleteBody = await deleteResponse.json();
  assert.equal(deleteBody.archived.id, id);
  assert.equal(deleteBody.archived.status, "archived");
  assert.equal(deleteBody.countDelta, 0);

  const detailResponse = await fetch(`${baseUrl}/api/knowledge/${encodeURIComponent(id)}`);
  assert.equal(detailResponse.status, 200);
  const detailBody = await detailResponse.json();
  assert.equal(detailBody.status, "archived");

  const searchResponse = await fetch(`${baseUrl}/api/search?q=delete-test-keyword`);
  assert.equal(searchResponse.status, 200);
  const searchBody = await searchResponse.json();
  assert.equal(searchBody.results.some((entry) => entry.id === id), false);

  const archivedSearchResponse = await fetch(`${baseUrl}/api/search?q=delete-test-keyword&includeArchived=true`);
  assert.equal(archivedSearchResponse.status, 200);
  const archivedSearchBody = await archivedSearchResponse.json();
  assert.equal(archivedSearchBody.results.some((entry) => entry.id === id), true);
});

test("upload API extracts docx and pdf text before creating knowledge drafts", async (t) => {
  const backup = fs.readFileSync(dbPath, "utf8");
  const createdFiles = [];

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: isolatedServerEnv(t, {
      LLM_API_KEY: "",
      OPENAI_API_KEY: ""
    }),
    stdio: "pipe"
  });

  t.after(() => {
    child.kill();
    fs.writeFileSync(dbPath, backup, "utf8");
    for (const filePath of createdFiles) {
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* 清理临时文件失败不应导致测试失败 */ }
    }
  });

  await waitForHealth();

  const docxResponse = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: "teacher-challenge.docx",
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 512,
      dataUrl: dataUrl(minimalDocx("挑战资料 Prompt 任务拆解"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    })
  });
  assert.equal(docxResponse.status, 201);
  const docxBody = await docxResponse.json();
  createdFiles.push(path.join(rootDir, "data", "uploads", docxBody.file.storedName));
  assert.equal(docxBody.entry.analysisStatus, "llm-disabled");
  assert.equal(docxBody.entry.extractionStatus, "text-extracted");
  assert.match(docxBody.entry.extractedTextPreview, /挑战资料 Prompt/);
  assert.equal(docxBody.entry.type, "challenge");

  const pdfResponse = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: "project-case.pdf",
      fileType: "application/pdf",
      fileSize: 512,
      dataUrl: dataUrl(minimalPdf("项目案例 AI 复盘"), "application/pdf")
    })
  });
  assert.equal(pdfResponse.status, 201);
  const pdfBody = await pdfResponse.json();
  createdFiles.push(path.join(rootDir, "data", "uploads", pdfBody.file.storedName));
  assert.equal(pdfBody.entry.extractionStatus, "text-extracted");
  assert.match(pdfBody.entry.extractedTextPreview, /项目案例 AI 复盘/);
  assert.equal(pdfBody.entry.type, "project");
});

test("upload API returns a structured knowledge processing card from LLM analysis", async (t) => {
  const backup = fs.readFileSync(dbPath, "utf8");
  const createdFiles = [];
  const fakeLlm = await startFakeLlmServer(t, () => ({
    title: "挑战拆解示例",
    type: "challenge",
    summary: "这份资料帮助学生理解挑战目标、交付要求和完成路径。",
    audience: ["学生", "老师", "Builder"],
    tags: ["challenge", "demo"],
    keywords: ["挑战", "交付物", "老师带练"],
    concepts: ["挑战目标", "交付要求"],
    skills: ["任务拆解", "学习复盘"],
    deliverables: ["项目方案", "复盘记录"],
    situation: "学生刚拿到挑战资料，需要知道先看什么、怎么完成。",
    ontology: "挑战资料 -> 目标 -> 交付物 -> 评价方式 -> 学习行动。",
    workflow: "先识别目标，再拆交付物，最后形成行动清单。",
    skill: "把任务说明拆成可执行步骤。",
    evaluation: "能否说清目标、交付物和下一步行动。",
    knowledgeGrowth: "完成后可以沉淀为挑战说明和项目复盘资料。",
    confidence: 0.86,
    knowledgeProcessing: {
      classificationReason: "正文多次出现挑战目标、交付物和评价方式，因此归类为挑战。",
      coreProblem: "学生不知道拿到挑战资料后该先理解什么、怎么开始做。",
      keyPoints: ["挑战目标", "交付物要求", "评价方式"],
      suggestedRelations: [
        {
          predicate: "usesPrompt",
          targetHint: "挑战拆解提示词",
          reason: "可以帮助学生把挑战要求拆成执行步骤。"
        }
      ],
      missingFields: ["关联项目案例还需要补充"],
      nextActions: ["检查分类是否正确", "补充相关项目案例", "开始老师带练"]
    }
  }));

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: isolatedServerEnv(t, {
      LLM_API_KEY: "fake-key",
      OPENAI_API_KEY: "",
      LLM_BASE_URL: fakeLlm.baseUrl,
      OPENAI_BASE_URL: "",
      LLM_MODEL: "fake-upload-model",
      OPENAI_MODEL: ""
    }),
    stdio: "pipe"
  });

  t.after(() => {
    child.kill();
    fs.writeFileSync(dbPath, backup, "utf8");
    for (const filePath of createdFiles) {
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* 清理临时文件失败不应导致测试失败 */ }
    }
  });

  await waitForHealth();

  const response = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: "challenge-demo.md",
      fileType: "text/markdown",
      fileSize: 256,
      text: "挑战目标：完成一个 AI 学习助手。交付物：项目方案和复盘记录。评价方式：说明是否清楚。"
    })
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  createdFiles.push(path.join(rootDir, "data", "uploads", body.file.storedName));

  assert.equal(body.entry.analysisStatus, "llm-analyzed");
  assert.equal(body.entry.type, "challenge");
  assert.equal(body.entry.knowledgeProcessing.classificationReason, "正文多次出现挑战目标、交付物和评价方式，因此归类为挑战。");
  assert.equal(body.entry.knowledgeProcessing.coreProblem, "学生不知道拿到挑战资料后该先理解什么、怎么开始做。");
  assert.deepEqual(body.entry.knowledgeProcessing.keyPoints, ["挑战目标", "交付物要求", "评价方式"]);
  assert.equal(body.entry.knowledgeProcessing.suggestedRelations[0].predicate, "usesPrompt");
  assert.ok(body.entry.knowledgeProcessing.nextActions.includes("开始老师带练"));

  assert.equal(fakeLlm.requests.length, 1);
  assert.match(JSON.stringify(fakeLlm.requests[0].messages), /knowledgeProcessing/);
});

test("relationship API adds and lists explicit knowledge relationships", async (t) => {
  const backup = fs.readFileSync(dbPath, "utf8");

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: isolatedServerEnv(t),
    stdio: "pipe"
  });

  t.after(() => {
    child.kill();
    fs.writeFileSync(dbPath, backup, "utf8");
  });

  await waitForHealth();

  const sourceId = `kb-relationship-source-${Date.now()}`;
  const targetId = `kb-relationship-target-${Date.now()}`;
  for (const item of [
    { id: sourceId, title: "关系源条目", keywords: ["relationship-source", "关系源", "项目案例"] },
    { id: targetId, title: "关系目标条目", keywords: ["relationship-target", "关系目标", "挑战"] }
  ]) {
    const response = await fetch(`${baseUrl}/api/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        type: "project",
        status: "draft",
        audience: ["Builder"],
        summary: "用于验证显式关系管理的临时知识条目。"
      })
    });
    assert.equal(response.status, 201);
  }

  const addResponse = await fetch(`${baseUrl}/api/knowledge/${encodeURIComponent(sourceId)}/relationships`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      predicate: "supports",
      target: targetId,
      note: "项目案例支持挑战说明"
    })
  });
  assert.equal(addResponse.status, 201);
  const added = await addResponse.json();
  assert.equal(added.relationship.predicate, "supports");
  assert.equal(added.relationship.target, targetId);
  assert.equal(added.relationship.targetLabel, "关系目标条目");

  const listResponse = await fetch(`${baseUrl}/api/knowledge/${encodeURIComponent(sourceId)}/relationships`);
  assert.equal(listResponse.status, 200);
  const listBody = await listResponse.json();
  assert.equal(listBody.relationships.length, 1);
  assert.equal(listBody.relationships[0].target, targetId);
});

test("knowledge graph API exposes visible nodes and relationship links", async (t) => {
  const backup = fs.readFileSync(dbPath, "utf8");

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: isolatedServerEnv(t),
    stdio: "pipe"
  });

  t.after(() => {
    child.kill();
    fs.writeFileSync(dbPath, backup, "utf8");
  });

  await waitForHealth();

  const stamp = Date.now();
  const sourceId = `kb-graph-source-${stamp}`;
  const targetId = `kb-graph-target-${stamp}`;
  const archivedId = `kb-graph-archived-${stamp}`;

  for (const item of [
    {
      id: targetId,
      title: "图谱目标知识",
      type: "prompt",
      status: "draft",
      keywords: ["graph-target", "图谱目标", "提示词"],
      summary: "用于验证图谱节点的目标知识。"
    },
    {
      id: archivedId,
      title: "图谱归档知识",
      type: "project",
      status: "archived",
      keywords: ["graph-archived", "图谱归档", "归档"],
      summary: "归档条目默认不应该进入图谱。"
    },
    {
      id: sourceId,
      title: "图谱来源知识",
      type: "challenge",
      status: "draft",
      keywords: ["graph-source", "图谱来源", "挑战"],
      related: [targetId, archivedId],
      relationships: [
        {
          predicate: "usesPrompt",
          target: targetId,
          targetLabel: "图谱目标知识",
          note: "挑战使用该提示词"
        },
        {
          predicate: "relatedTo",
          target: archivedId,
          targetLabel: "图谱归档知识"
        }
      ],
      summary: "用于验证图谱连线的来源知识。"
    }
  ]) {
    const response = await fetch(`${baseUrl}/api/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        audience: ["Builder", "Agent"]
      })
    });
    assert.equal(response.status, 201);
  }

  const response = await fetch(`${baseUrl}/api/knowledge-graph`);
  assert.equal(response.status, 200);
  const body = await response.json();

  const nodeIds = body.nodes.map((node) => node.id);
  assert.ok(nodeIds.includes(sourceId));
  assert.ok(nodeIds.includes(targetId));
  assert.equal(nodeIds.includes(archivedId), false);

  const sourceNode = body.nodes.find((node) => node.id === sourceId);
  assert.equal(sourceNode.type, "challenge");
  assert.equal(sourceNode.degree, 1);

  assert.ok(body.links.some((link) => (
    link.source === sourceId &&
    link.target === targetId &&
    link.predicate === "usesPrompt"
  )));
  assert.equal(body.links.some((link) => link.target === archivedId), false);
  assert.equal(body.stats.nodeCount, body.nodes.length);
  assert.equal(body.stats.linkCount, body.links.length);
});

test("knowledge graph API adds project structure nodes from project metadata", async (t) => {
  const backup = fs.readFileSync(dbPath, "utf8");

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: isolatedServerEnv(t),
    stdio: "pipe"
  });

  t.after(() => {
    child.kill();
    fs.writeFileSync(dbPath, backup, "utf8");
  });

  await waitForHealth();

  const projectId = `kb-graph-project-${Date.now()}`;
  const createResponse = await fetch(`${baseUrl}/api/knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: projectId,
      title: "Graph Project Structure",
      type: "project",
      status: "draft",
      audience: ["Builder", "Agent"],
      keywords: ["graph-project-structure", "项目结构", "图谱"],
      concepts: ["Concept Alpha"],
      skills: ["Skill Beta"],
      deliverables: ["Deliverable Gamma"],
      summary: "A project should expose its internal structure in the graph."
    })
  });
  assert.equal(createResponse.status, 201);

  const response = await fetch(`${baseUrl}/api/knowledge-graph`);
  assert.equal(response.status, 200);
  const body = await response.json();

  const structureNodes = body.nodes.filter((node) => (
    node.kind === "structure" &&
    node.parentId === projectId
  ));
  assert.deepEqual(
    structureNodes.map((node) => `${node.subtype}:${node.title}`).sort(),
    [
      "concept:Concept Alpha",
      "deliverable:Deliverable Gamma",
      "skill:Skill Beta"
    ]
  );

  for (const node of structureNodes) {
    assert.ok(body.links.some((link) => (
      link.source === projectId &&
      link.target === node.id &&
      link.predicate === "includes"
    )));
  }
});

test("guided path API builds a teacher-led learning path from relationships", async (t) => {
  const backup = fs.readFileSync(dbPath, "utf8");

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: isolatedServerEnv(t, {
      LLM_API_KEY: "",
      OPENAI_API_KEY: ""
    }),
    stdio: "pipe"
  });

  t.after(() => {
    child.kill();
    fs.writeFileSync(dbPath, backup, "utf8");
  });

  await waitForHealth();

  const stamp = Date.now();
  const challengeId = `kb-guided-challenge-${stamp}`;
  const promptId = `kb-guided-prompt-${stamp}`;
  const projectId = `kb-guided-project-${stamp}`;

  for (const item of [
    {
      id: promptId,
      title: "挑战拆解提示词",
      type: "prompt",
      keywords: ["guided-path-prompt", "提示词", "带练"],
      summary: "帮助学生把挑战要求拆成可执行步骤的提示词。"
    },
    {
      id: projectId,
      title: "大数据挑战参考案例",
      type: "project",
      keywords: ["guided-path-project", "项目案例", "带练"],
      summary: "展示学生如何把挑战要求落到项目作品里的案例。"
    },
    {
      id: challengeId,
      title: "大数据应用挑战",
      type: "challenge",
      keywords: ["guided-path-challenge", "挑战", "带练"],
      summary: "要求学生理解 AI+X 材料并提出大数据应用方案。",
      relationships: [
        {
          predicate: "usesPrompt",
          target: promptId,
          targetLabel: "挑战拆解提示词"
        },
        {
          predicate: "relatedTo",
          target: projectId,
          targetLabel: "大数据挑战参考案例"
        }
      ]
    }
  ]) {
    const response = await fetch(`${baseUrl}/api/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...item,
        status: "draft",
        audience: ["Builder", "Agent"]
      })
    });
    assert.equal(response.status, 201);
  }

  const response = await fetch(`${baseUrl}/api/guided-path?entryId=${encodeURIComponent(challengeId)}`);
  assert.equal(response.status, 200);
  const body = await response.json();

  assert.equal(body.entry.id, challengeId);
  assert.equal(body.mode, "rule-template");
  assert.equal(body.llmReady, false);
  assert.match(body.goal, /挑战/);
  assert.ok(Array.isArray(body.readingMap));
  assert.ok(body.readingMap.length >= 4);
  assert.ok(body.readingMap.some((section) => section.title === "文档概览"));
  assert.ok(body.fieldMappings.some((item) => item.field === "summary"));
  assert.ok(Array.isArray(body.fieldMappings));
  assert.ok(body.fieldMappings.some((item) => item.field === "concepts"));
  assert.ok(body.fieldMappings.some((item) => item.field === "skills"));
  assert.ok(body.steps.length >= 4);
  assert.equal(body.steps[0].entry.id, challengeId);
  assert.ok(body.steps.some((step) => step.entry && step.entry.id === promptId));
  assert.ok(body.steps.some((step) => step.entry && step.entry.id === projectId));
  assert.ok(body.steps.every((step) => step.teacherScript && step.checkQuestion));

  const missingResponse = await fetch(`${baseUrl}/api/guided-path?entryId=missing-entry`);
  assert.equal(missingResponse.status, 404);
});

test("guided path API uses LLM when a model is configured", async (t) => {
  const backup = fs.readFileSync(dbPath, "utf8");
  const fakeLlm = await startFakeLlmServer(t, () => ({
    goal: "LLM generated guided goal",
    steps: [
      {
        title: "LLM generated first step",
        teacherScript: "LLM generated teacher script for this exact entry.",
        checkQuestion: "What did the LLM ask you to verify?",
        reason: "generated by model"
      }
    ]
  }));

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: isolatedServerEnv(t, {
      LLM_API_KEY: "fake-key",
      OPENAI_API_KEY: "",
      LLM_BASE_URL: fakeLlm.baseUrl,
      OPENAI_BASE_URL: "",
      LLM_MODEL: "fake-guided-model",
      OPENAI_MODEL: ""
    }),
    stdio: "pipe"
  });

  t.after(() => {
    child.kill();
    fs.writeFileSync(dbPath, backup, "utf8");
  });

  await waitForHealth();

  const entryId = `kb-guided-llm-${Date.now()}`;
  const createResponse = await fetch(`${baseUrl}/api/knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: entryId,
      title: "LLM guided path source",
      type: "project",
      status: "draft",
      audience: ["Builder", "Agent"],
      keywords: ["guided-llm", "带练", "项目案例"],
      summary: "A source entry for checking that guided practice is model generated."
    })
  });
  assert.equal(createResponse.status, 201);

  const response = await fetch(`${baseUrl}/api/guided-path?entryId=${encodeURIComponent(entryId)}`);
  assert.equal(response.status, 200);
  const body = await response.json();

  assert.equal(body.entry.id, entryId);
  assert.equal(body.llmReady, true);
  assert.equal(body.mode, "llm-generated");
  assert.match(body.llmNote, /fake-guided-model/);
  assert.equal(body.goal, "LLM generated guided goal");
  assert.equal(body.steps[0].title, "LLM generated first step");
  assert.equal(body.steps[0].teacherScript, "LLM generated teacher script for this exact entry.");
  assert.equal(fakeLlm.requests.length, 1);
  assert.equal(fakeLlm.requests[0].model, "fake-guided-model");
});

test("agent context API returns cited, trust-ranked, role-filtered knowledge", async (t) => {
  const backup = fs.readFileSync(dbPath, "utf8");

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: isolatedServerEnv(t),
    stdio: "pipe"
  });

  t.after(() => {
    child.kill();
    fs.writeFileSync(dbPath, backup, "utf8");
  });

  await waitForHealth();

  const stamp = Date.now();
  const stableId = `kb-agent-stable-${stamp}`;
  const draftId = `kb-agent-draft-${stamp}`;
  const teacherId = `kb-agent-teacher-${stamp}`;

  for (const item of [
    {
      id: draftId, title: "Agent 上下文草稿条目", type: "challenge", status: "draft",
      audience: ["student", "agent"], keywords: ["agentctx-shared", "挑战", "草稿"],
      summary: "同一关键词下的草稿条目，用于验证可信度排序。"
    },
    {
      id: stableId, title: "Agent 上下文稳定条目", type: "challenge", status: "draft",
      audience: ["student", "agent"], keywords: ["agentctx-shared", "挑战", "稳定"],
      summary: "同一关键词下的条目，稍后推到 stable，应排在草稿之前。",
      relationships: [{ predicate: "supports", target: draftId, targetLabel: "Agent 上下文草稿条目" }]
    },
    {
      id: teacherId, title: "Agent 上下文教师条目", type: "faq", status: "draft",
      audience: ["teacher"], keywords: ["agentctx-shared", "教师", "FAQ"],
      summary: "只面向教师的条目，role=student 时应被过滤掉。"
    }
  ]) {
    const r = await fetch(`${baseUrl}/api/knowledge`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    assert.equal(r.status, 201);
  }

  // 把 stableId 推到 stable：draft -> review -> stable
  for (const target of ["review", "stable"]) {
    const tr = await fetch(`${baseUrl}/api/knowledge/${encodeURIComponent(stableId)}/transition`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: target })
    });
    assert.equal(tr.status, 200);
  }

  // 1) 基本检索 + 可信度排序：stable 应排在 draft 之前
  const ctxRes = await fetch(`${baseUrl}/api/agent/context?q=${encodeURIComponent("agentctx-shared")}&limit=10`);
  assert.equal(ctxRes.status, 200);
  const ctxBody = await ctxRes.json();
  assert.ok(Array.isArray(ctxBody.context));
  const ours = ctxBody.context.filter((c) => [stableId, draftId, teacherId].includes(c.id));
  const stablePos = ours.findIndex((c) => c.id === stableId);
  const draftPos = ours.findIndex((c) => c.id === draftId);
  assert.ok(stablePos !== -1 && draftPos !== -1);
  assert.ok(stablePos < draftPos, "stable 条目应排在 draft 之前");

  // 2) 每条都带引用（citation）与结构化字段
  const stableItem = ctxBody.context.find((c) => c.id === stableId);
  assert.equal(stableItem.citation.id, stableId);
  assert.ok(stableItem.citation.title.length > 0);
  assert.equal(stableItem.status, "stable");
  assert.ok(Array.isArray(stableItem.relationships));
  assert.equal(stableItem.relationships[0].predicate, "supports");
  assert.equal(stableItem.relationships[0].target, draftId);

  // 3) role 过滤：role=student 时，仅面向教师的条目应被过滤
  const studentRes = await fetch(`${baseUrl}/api/agent/context?q=${encodeURIComponent("agentctx-shared")}&role=student&limit=10`);
  const studentBody = await studentRes.json();
  const studentIds = studentBody.context.map((c) => c.id);
  assert.ok(studentIds.includes(stableId));
  assert.ok(!studentIds.includes(teacherId), "role=student 不应返回仅面向教师的条目");

  // 4) type 过滤：type=faq 只返回 faq
  const faqRes = await fetch(`${baseUrl}/api/agent/context?q=${encodeURIComponent("agentctx-shared")}&type=faq&limit=10`);
  const faqBody = await faqRes.json();
  assert.ok(faqBody.context.every((c) => c.type === "faq"));
  assert.ok(faqBody.context.some((c) => c.id === teacherId));
});
