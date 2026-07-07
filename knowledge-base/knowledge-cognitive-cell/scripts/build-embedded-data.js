const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const appDir = path.join(rootDir, "app");
const knowledgeDataPath = path.join(appDir, "knowledge-data.json");
const searchIndexPath = path.join(appDir, "search-index.json");
const outputPath = path.join(appDir, "embedded-data.js");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function buildEmbeddedData() {
  const knowledgeData = readJson(knowledgeDataPath);
  const searchIndex = readJson(searchIndexPath);
  const payload = {
    knowledgeData,
    searchIndex
  };

  const output = `window.__NSEAP_EMBEDDED_DATA__ = ${JSON.stringify(payload, null, 2)};\n`;
  fs.writeFileSync(outputPath, output, "utf8");
  console.log(`Built embedded data -> ${path.relative(rootDir, outputPath)}`);
}

buildEmbeddedData();
