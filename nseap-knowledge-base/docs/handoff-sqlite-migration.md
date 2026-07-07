# 交接文档：SQLite 迁移（方案 A，V0.3 → V1.0 后端地基）

> 日期：2026-07-07  
> 状态：**进行中，已完成核心部分，差最后收尾**

---

## 背景

项目设计方案（`DESIGN.md` 第 9.2 章）要求把运行时数据从单个 `data/knowledge-db.json` 迁移到真正的关系型数据库，并补上修订历史（`knowledge_revisions`）。这是 V0.3 → V1.0「正式后端」的核心步骤。

技术选型：Node 22 内置的 `node:sqlite`，**零新增依赖**，延续项目一贯的零依赖风格。

---

## 已完成的内容

### 1. `server/store.js`（新建，未提交）

SQLite 存储层，实现了：

- 建表：`knowledge_items`、`knowledge_item_values`（多值子表）、`knowledge_relationships`、`knowledge_revisions`、`db_singletons`（存 meta/categories/flow）
- `loadDb()`：从 SQLite 重建出与旧 JSON 库结构完全一致的对象（通过 `doc_json` 列保证 byte 级无损）
- `saveDb(db)`：写各表 + 内容哈希变化时自动追加修订快照 + 同步 JSON 镜像
- `listRevisions(itemId)`：查修订历史（新→旧）
- `reseedFromJson(jsonPath)`：从 JSON 镜像重建 SQLite（给 import 脚本用，详见第 4 点）
- 首次启动时从现有 `knowledge-db.json` 自动播种，无需手动初始化

### 2. `server/server.js`（已修改，未提交）

- 顶部新增 `require('./store')` 和路径配置（`sqlitePath`、`dbPath` 支持 env 覆盖）
- `readDb()` / `writeDb()` 改为委托给 `getStore()`，**返回对象结构与旧 JSON 库完全一致，15 处调用点和整个 API 契约零改动**
- 新增端点 `GET /api/knowledge/:id/revisions?limit=N`，返回该条目修订历史（新→旧，含 revisionId/contentHash/status/createdAt）
- 支持两个新环境变量：
  - `KB_SQLITE_PATH`：SQLite 文件路径（默认 `data/knowledge.db`）
  - `KB_DB_PATH`：JSON 镜像路径（默认 `data/knowledge-db.json`）

### 3. `tests/settings-api.test.js`（已修改，未提交）

- `isolatedServerEnv()` 改为每次 spawn 都用独立临时 SQLite + 临时 JSON 镜像，测试互不干扰，不污染仓库数据
- 原有 23 条断言全部保留
- 新增第 24 条测试：`revisions API records content history across create and edits`（验证创建后有 1 条修订、流转后修订数增加、未知条目返回 404）
- **当前：24/24 全绿**

### 4. `scripts/import-knowledge.js`（已修改，未提交）

- 原来写完 JSON 就结束；现在在写完 JSON 后，若 `data/knowledge.db` 存在则调用 `store.reseedFromJson()` 把新内容同步进 SQLite，防止 `import:md` 后运行库仍是旧数据

### 5. `.gitignore`（已修改，未提交）

加了三行：
```
data/knowledge.db
data/knowledge.db-wal
data/knowledge.db-shm
```

---

## 还差什么（收尾，未做）

只剩一步：**最终验证 + 提交**。

### 收尾步骤

1. **验证 `import:md` 在真实环境中的 reseed 路径**

   先启动服务（会创建真实 `data/knowledge.db`），停掉后跑 `import:md`，确认输出里出现「已同步进 SQLite 运行时库」而不是「尚未创建」提示：

   ```bash
   cd nseap-knowledge-base
   npm run dev          # 启动，待 health ok 后 Ctrl+C 停掉
   npm run import:md    # 应输出"已同步进 SQLite 运行时库（17 条）"
   ```

2. **确认 `data/knowledge.db` 被 gitignore 排除**

   ```bash
   git status nseap-knowledge-base/data/   # 应只有 knowledge-db.json，不出现 .db
   ```

3. **跑完整测试最后确认**

   ```bash
   npm test   # 应 24/24 全绿
   ```

4. **提交**

   ```bash
   cd /Users/yinzhenyu1/Desktop/Elite20
   git add nseap-knowledge-base/server/store.js \
           nseap-knowledge-base/server/server.js \
           nseap-knowledge-base/tests/settings-api.test.js \
           nseap-knowledge-base/scripts/import-knowledge.js \
           nseap-knowledge-base/.gitignore
   git commit -m "feat(kb): migrate runtime store to SQLite (V1.0 backend foundation)

   - Add server/store.js: node:sqlite storage layer with knowledge_items,
     multi-value child tables, knowledge_relationships, knowledge_revisions
   - readDb/writeDb now delegate to SQLite; API contract unchanged (doc_json
     column guarantees byte-for-byte round-trip)
   - Add GET /api/knowledge/:id/revisions endpoint
   - Tests use isolated temp SQLite per spawn; 23 existing tests kept green;
     add test #24 for revision history
   - import-knowledge.js reseeds SQLite after writing JSON mirror
   - .gitignore: exclude data/knowledge.db*

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

## 关键设计决策（供参考）

| 决策 | 原因 |
|------|------|
| `doc_json` 列存完整条目 | 保证 API 契约不变，server.js 15 处调用点零改动 |
| JSON 镜像保留 | DESIGN 验收第 9 条要求可导出 JSON；import/export 脚本继续用它 |
| `reseed` 保留修订历史 | `DELETE` 只清 items/values/relationships，不动 revisions |
| 环境变量 `KB_SQLITE_PATH` | 测试可独立隔离，不污染生产数据 |
| `node:sqlite` 免 flag | 在 Node 22.23 上已默认可用（有 ExperimentalWarning 但不影响运行） |

---

## 验证命令速查

```bash
# 修订历史端点
curl "http://127.0.0.1:8787/api/knowledge/kb-challenge-001/revisions"

# 确认 SQLite 真实列可查询（绕过 API 直接看库）
node -e "
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('data/knowledge.db');
const rows=db.prepare('SELECT id,type,status FROM knowledge_items ORDER BY seq').all();
console.table(rows);
" 2>/dev/null

# 全量测试
npm test
```
