#!/usr/bin/env node
/**
 * 一次性端到端验证：上传文件时是否自动生成 agentNotes 并落库。
 * 用独立临时 DB，跑完即弃，不碰正式 data/knowledge.db。
 * 无 LLM 时应走 ruleAnalysis 兜底桩；有 LLM 时走模型生成。
 */
const path = require("path");
const os = require("os");
const fs = require("fs");
const http = require("http");

// 用临时目录做 DB，隔离正式库
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "kb-verify-"));
process.env.KB_SQLITE_PATH = path.join(tmpDir, "verify.db");
process.env.KB_DB_PATH = path.join(tmpDir, "verify.json");
// 隔离 runtime config + 清空 API key，强制走规则兜底（确定性、不花 token、专测兜底桩）
process.env.RUNTIME_CONFIG_PATH = path.join(tmpDir, "no-config.json");
delete process.env.LLM_API_KEY;
delete process.env.OPENAI_API_KEY;
process.env.PORT = "8799";

// 起服务
require(path.join(__dirname, "..", "server", "server.js"));

function post(pathname, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { host: "127.0.0.1", port: 8799, path: pathname, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(buf || "{}") }));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

(async function () {
  await new Promise((r) => setTimeout(r, 800)); // 等服务起来
  const resp = await post("/api/upload", {
    fileName: "验证用-学习助手挑战.md",
    text: "# 构建一个学习助手\n\n本挑战要求学生用 AI 做一个能回答课程问题的学习助手，交付一个可演示的原型和一份说明文档。",
    fileSize: 200
  });

  const entry = resp.body && resp.body.entry;
  console.log("=== 上传返回状态 ===", resp.status);
  console.log("=== 生成的 entry.type ===", entry && entry.type);
  console.log("=== metadataGeneratedBy ===", entry && entry.metadataGeneratedBy);
  console.log("=== agentNotes 是否存在 ===", entry && entry.agentNotes ? "✅ 有" : "❌ 缺失");
  console.log("=== agentNotes 内容 ===");
  console.log(entry && entry.agentNotes);

  // 校验：agentNotes 非空，且包含三段结构关键词
  const notes = (entry && entry.agentNotes) || "";
  const ok = notes.includes("触发条件") && notes.includes("能力范围") && notes.includes("限制");
  console.log("\n=== 结构校验(含 触发条件/能力范围/限制) ===", ok ? "✅ 通过" : "❌ 不符合格式");

  process.exit(ok ? 0 : 1);
})();
