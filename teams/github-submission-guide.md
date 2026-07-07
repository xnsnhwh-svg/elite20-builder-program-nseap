# GitHub Submission Guide

## The Question

If a Builder team has completed an MVP module, should they create their own GitHub repository, or wait for the shared repository and submit there?

## Recommended Answer

Use this shared repository as the official coordination and submission hub:

https://github.com/a976xw7td/elite20-builder-program-nseap

For MVP stage, the best rule is:

```text
One shared main repository
+ team folders
+ optional personal/team working repos
+ final submission linked back to the main repository
```

## Why

If every team only creates separate repositories, the work will become scattered.

If everyone waits for one central maintainer to upload everything, progress will slow down.

So the balanced approach is:

- The shared repository is the official system record.
- Teams can work independently.
- Final outputs must be registered back into the shared repository.

## Three Acceptable Submission Modes

### Mode 1: Direct Folder Submission

Use this when the output is mainly documents, templates, plans, prompts, or specs.

Example:

```text
teams/challenge-team/challenge-catalog/C01.md
teams/ontology-team/skill-ontology/README.md
teams/knowledge-team/prompt-library/coding-coach-prompts.md
```

Submit through:

```text
Pull Request -> Peer Review -> Agent Review -> Merge
```

### Mode 2: Team Working Repository + Main Repo Index

Use this when the output is a runnable project, website, LMS prototype, Agent service, or large codebase.

The team may create its own repository, for example:

```text
elite20-platform-demo
elite20-evaluation-agent
elite20-knowledge-base-prototype
```

But the team must add an index entry in the main repository:

```text
teams/platform-team/website/README.md
teams/agent-team/evaluation-agent/README.md
```

The index should include:

```text
project name
team members
repo link
demo link
current status
how it connects to NSEAP
review status
next action
```

### Mode 3: Fork + Pull Request

Use this when a Builder wants to contribute directly to the shared repository.

Workflow:

```text
Fork repository
-> create branch
-> edit files
-> submit Pull Request
-> Peer Review
-> Agent Review
-> Merge
```

## Suggested Answer To Team Members

You can reply:

```text
建议先以这个共享仓库作为统一提交入口：
https://github.com/a976xw7td/elite20-builder-program-nseap

如果你的模块主要是文档、模板、方案、Prompt、Ontology、Rubric，可以直接提交到对应 team 文件夹。

如果你的模块是独立可运行项目，比如网站、Agent 服务、LMS 原型，可以自己建一个工作仓库，但需要在主仓库对应 team 目录下登记项目链接、说明、状态和下一步。

也就是说：可以自己建仓库干活，但最终必须回到主仓库登记和接受 Review。主仓库是二期 Builder Program 的统一协作和沉淀入口。
```

## Minimum Submission Record

Every team output should include:

```yaml
module_name:
team:
owner:
members:
status:
repo_url:
demo_url:
related_challenge:
related_skill:
related_agent:
related_ontology:
review_status:
next_action:
```

## Review Flow

```text
Team submits output
-> Peer Review
-> Agent Review
-> Maintainer / instructor confirmation
-> Merge or register
-> Documentation
-> Release
```

