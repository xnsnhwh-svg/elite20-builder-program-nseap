const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const rootDir = path.resolve(__dirname, "..");
const configPath = path.join(rootDir, "data", "runtime-config.json");
const dbPath = path.join(rootDir, "data", "knowledge-db.json");
const port = 18987;
const baseUrl = `http://127.0.0.1:${port}`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const backup = fs.existsSync(configPath)
    ? fs.readFileSync(configPath, "utf8")
    : null;

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(port),
      LLM_API_KEY: "",
      OPENAI_API_KEY: "",
      LLM_BASE_URL: "",
      OPENAI_BASE_URL: "",
      LLM_MODEL: "",
      OPENAI_MODEL: ""
    },
    stdio: "pipe"
  });

  t.after(() => {
    child.kill();
    if (backup === null) {
      if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
    } else {
      fs.writeFileSync(configPath, backup, "utf8");
    }
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

test("knowledge API deletes an entry and removes it from search results", async (t) => {
  const backup = fs.readFileSync(dbPath, "utf8");

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(port)
    },
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
      keywords: ["delete-test-keyword"],
      summary: "用于验证删除知识条目的临时数据。"
    })
  });
  assert.equal(createResponse.status, 201);

  const deleteResponse = await fetch(`${baseUrl}/api/knowledge/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
  assert.equal(deleteResponse.status, 200);
  const deleteBody = await deleteResponse.json();
  assert.equal(deleteBody.deleted.id, id);
  assert.equal(deleteBody.countDelta, -1);

  const detailResponse = await fetch(`${baseUrl}/api/knowledge/${encodeURIComponent(id)}`);
  assert.equal(detailResponse.status, 404);

  const searchResponse = await fetch(`${baseUrl}/api/search?q=delete-test-keyword`);
  assert.equal(searchResponse.status, 200);
  const searchBody = await searchResponse.json();
  assert.equal(searchBody.results.some((entry) => entry.id === id), false);
});
