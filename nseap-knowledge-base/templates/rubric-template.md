---
id: kb-rubric-001
title: Rubric 评分标准标题
type: rubric
summary: 用一句话说明这个 Rubric 评估什么挑战、从哪些维度打分。
audience:
  - teacher
  - agent
keywords:
  - Rubric
  - 评分标准
  - 评审
  - 目标挑战关键词
tags:
  - rubric
  - evaluation
concepts:
  - 评审维度
  - 等级描述
skills:
  - 结构化评审
# 关联的挑战（本 Rubric 评估谁）和其他相关条目
relationships:
  - predicate: assessedBy
    target: kb-challenge-001
    note: 本 Rubric 评估该挑战的提交
  - predicate: relatedTo
    target: kb-best-practice-001
status: draft
updated: YYYY-MM-DD
source: ../knowledge-base/06-rubrics/your-rubric.md
---

# Rubric 评分标准标题

## 评估对象

本 Rubric 用于评估哪个 Challenge 的提交？

- 关联 Challenge：`kb-challenge-001`
- 适用阶段：提交后首轮评审 / 同伴评审 / 教师终审

## 评分维度 Dimensions

### 维度 1：产品定义清晰度（权重 25%）

| 等级 | 分数 | 描述 |
|------|------|------|
| 优秀 | 90-100 | 有清晰的产品定义，目标用户明确，功能边界合理 |
| 良好 | 70-89 | 有产品定义但目标用户或边界有模糊之处 |
| 基本 | 50-69 | 产品定义不完整，缺少目标用户或功能范围 |
| 不足 | 0-49 | 无明确产品定义 |

### 维度 2：知识条目结构完整性（权重 25%）

| 等级 | 分数 | 描述 |
|------|------|------|
| 优秀 | 90-100 | 条目结构完整，包含所有必填字段且内容充实 |
| 良好 | 70-89 | 结构基本完整，个别字段内容偏薄 |
| 基本 | 50-69 | 缺少多个字段或字段内容空洞 |
| 不足 | 0-49 | 结构严重不完整 |

### 维度 3：Agent 可检索性（权重 25%）

| 等级 | 分数 | 描述 |
|------|------|------|
| 优秀 | 90-100 | 支持 Agent 检索，agentNotes 明确，关系显式标注 |
| 良好 | 70-89 | 基本支持检索但 agentNotes 或关系不够精确 |
| 基本 | 50-69 | 有基础 metadata 但 Agent 难以有效利用 |
| 不足 | 0-49 | 不支持 Agent 检索 |

### 维度 4：Knowledge Growth Loop 说明（权重 25%）

| 等级 | 分数 | 描述 |
|------|------|------|
| 优秀 | 90-100 | 清晰说明知识如何从作业过程沉淀为可复用资产 |
| 良好 | 70-89 | 有说明但闭环路径不够具体 |
| 基本 | 50-69 | 仅提及知识增长概念，无具体路径 |
| 不足 | 0-49 | 未涉及知识增长 |

## 及格线 Passing Score

总分（各维度加权平均）达到 **60 分** 即通过。

## 评审流程

1. Submission Task Agent 先校验提交包完整性
2. Review Task Agent 按本 Rubric 生成初评
3. 教师/同伴审阅初评结果并补充反馈
4. 最终结果回写 Feishu Airtable

## 常见错误与反馈模板

- 缺少 `reflection.md` → 提醒学生补充 AAR 复盘
- agentNotes 为空 → 建议参考已有条目补写触发条件和能力范围
- 无显式关系 → 引导建立至少 1 条与其他条目的关联

## Agent Notes

触发条件：Review Task Agent 评审提交时检索；教师查看评分标准时检索。
能力范围：提供评分维度、等级描述、权重分配和及格线。
限制：不含具体学生提交内容；评审结论需结合实际提交物判断。
联动：关联 Challenge 条目提供任务背景，关联 Best Practice 提供参考范式。
