# Git 提交推送助手 (git-commit-push)

一个把「跑测试 → 暂存我的改动 → 生成提交信息 → 提交 → 推送到 GitHub」这条流程固化下来的 skill。适用于任何 git 仓库，运行时可指定目标仓库。

## 何时使用

用户说类似这些话时触发：
- 「帮我提交」「提交一下」「commit 并推送」「推到 GitHub」
- 「把改动传上去」「同步到远程」
- 明确给出一个 GitHub 仓库链接并要求提交

## 核心原则（安全第一）

1. **绝不 `git add -A` / `git add .`**。这个仓库的 git 根可能包含多个团队/模块的目录，无脑全加会误提交别人未完成的文件。永远只暂存「用户实际改动的、属于当前工作区的」文件，且提交前必须列给用户确认。
2. **提交前必须先跑测试**（若项目有测试）。不绿就停下问用户，不擅自提交坏代码。
3. **凭据存 macOS 钥匙串（加密）**，不写明文文件。第一次需要用户提供 token，之后复用。
4. **token 绝不回显、绝不写进 git 配置的 URL、绝不落进任何被 git 跟踪的文件**。命令输出里用 `sed` 过滤 token。

## 执行步骤

### 第 0 步：确定目标仓库

- 若用户给了 GitHub 链接 → 用它作为 remote 目标。
- 若没给 → 用当前工作目录所在的 git 仓库（`git remote get-url origin`）。
- 先 `cd` 到仓库目录，确认 `git rev-parse --show-toplevel` 能拿到根。

### 第 1 步：跑测试（若有）

```bash
# 检测是否有测试脚本
cat package.json | grep '"test"'
# 有则跑，超时保护
timeout 40 npm test > /tmp/skill-test.txt 2>&1; echo "exit=$?"; tail -12 /tmp/skill-test.txt
```

- 测试全绿 → 继续。
- 测试失败或报错 → **停下**，把失败摘要给用户，问是否仍要提交。不擅自继续。
- 无测试脚本 → 跳过，但告知用户「此项目未检测到测试，已跳过」。

### 第 2 步：查看改动，只暂存用户工作区的文件

```bash
git status --short
```

- 分析哪些是「用户真正改动的文件」。若仓库根含多个团队目录（如 Elite20 下的 agents/ teams/ challenges/ 等），**只暂存用户当前在做的子目录/文件**，绝不碰其他目录。
- 若不确定某个改动属不属于用户，**列出来问用户**，不要自作主张。
- 处理 FUSE 陈旧锁：若遇到 `.git/index.lock: File exists` 或 `Operation not permitted`，用临时 index 绕过：

```bash
export GIT_INDEX_FILE=/tmp/skill-git.index
git read-tree HEAD
git add <逐个显式列出用户的文件>   # 绝不用 . 或 -A
git status --short   # 展示暂存清单给用户确认
```

- **把暂存清单展示给用户确认**，明确指出「无别组文件、无凭据文件、无临时文件」。

### 第 3 步：生成提交信息（自动生成，用户确认）

- 根据暂存的文件和改动内容，自动拟一条提交信息。格式跟随项目历史风格（如本项目用 `feat(kb): 中文简述` / `fix(kb): …`）。
- 用 `git log --oneline -5` 参考已有风格。
- **把拟好的提交信息给用户确认**，用户改了就用改后的。

### 第 4 步：提交

```bash
export GIT_INDEX_FILE=/tmp/skill-git.index   # 若第2步用了临时 index
git -c user.name="$(git log -1 --format='%an')" -c user.email="$(git log -1 --format='%ae')" \
  commit -m "确认后的提交信息" 2>&1 | grep -vE "unable to unlink|tmp_obj"
git log --oneline -3 | grep -vE "unable to unlink|tmp_obj"
```

### 第 5 步：确认是快进推送再推

```bash
# 确认本地领先远程且不改写历史（安全检查）
git merge-base --is-ancestor origin/main HEAD && echo "快进推送，安全" || echo "非快进，需谨慎——停下问用户"
git log origin/main..HEAD --oneline | grep -vE "unable to unlink|tmp_obj"   # 待推送的提交
```

- 非快进（可能会覆盖远程别人的提交）→ **停下问用户**，绝不 `--force`。

### 第 6 步：推送（凭据用钥匙串）

首次配置钥匙串凭据助手（只需一次）：

```bash
git config --global credential.helper osxkeychain
```

推送：

```bash
git push origin <当前分支>
```

- 若钥匙串里已有凭据 → 直接成功。
- 若提示需要凭据（`could not read Username` 或要求输入）→ 说明钥匙串里还没有，**请用户提供一次 GitHub token**。拿到后这样推（token 不回显）：

```bash
TOKEN='<用户提供的token>'
REPO_PATH='<owner/repo>'
git push "https://${TOKEN}@github.com/${REPO_PATH}.git" <分支> 2>&1 | sed "s/${TOKEN}/[TOKEN-已隐藏]/g"
```

- 推送成功后，把凭据存进钥匙串以便下次复用：

```bash
# 通过 osxkeychain helper 写入（token 作为 password）
printf "protocol=https\nhost=github.com\nusername=<github用户名>\npassword=${TOKEN}\n" | git credential-osxkeychain store
```

- 之后 `git push origin <分支>` 就能自动从钥匙串取凭据，无需再给 token。

### 第 7 步：汇报结果

- 告诉用户：跑了几个测试、提交了哪些文件、提交号、推送是否成功。
- 若过程中生成了临时文件（如 /tmp/skill-*），提示已清理或无害。

## 安全红线（务必遵守）

- ❌ 绝不 `git add .` 或 `git add -A`
- ❌ 绝不 `git push --force` / `--force-with-lease`（除非用户明确要求并理解后果）
- ❌ 绝不在输出里回显 token 明文
- ❌ 绝不把 token 写进 remote URL 后 `git remote set-url`（会存进 .git/config）
- ❌ 绝不提交 `.env`、`runtime-config.json`、含密钥的配置文件——提交前扫一眼暂存清单
- ✅ 提交范围、提交信息、非快进推送，三个关键点都要用户确认
