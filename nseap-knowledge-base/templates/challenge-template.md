---
id: kb-challenge-001
title: 挑战条目标题
type: challenge
summary: 用一句话说明这个挑战要完成什么任务，以及学习者做完能得到什么能力或产出。
audience:
  - student
keywords:
  - 挑战
  - 任务
  - 交付物
  - 核心对象词
tags:
  - challenge
concepts:
  - 核心概念
skills:
  - 目标技能
related:
  - kb-prompt-001
  - kb-project-001
# 挑战类至少补 1 条显式关系（DESIGN 8.5）：
# 常用 usesPrompt(用到的提示词) / supports(被哪个项目案例支持) / assessedBy(被哪个评价标准评估)
relationships:
  - predicate: usesPrompt
    target: kb-prompt-001
  - predicate: supports
    target: kb-project-001
status: draft
updated: YYYY-MM-DD
source: ../knowledge-base/02-challenges/your-challenge.md
---

# 挑战条目标题

## 用途

这个挑战让学习者练习什么？为什么值得做？

## 任务目标

学习者需要完成的核心任务是什么？（一句话说清"做出什么"）

## 步骤

1. 第一步
2. 第二步
3. 第三步

## 交付物 Deliverables

- 交付物 1
- 交付物 2

## 推荐提示词 / 参考案例

完成这个挑战可以复用哪些提示词模板或项目案例？（对应 relationships 里的 usesPrompt / supports）

## 评分 Evaluation

如何判断这个挑战是否合格完成？评分维度有哪些？

## 常见错误

学习者最容易在哪里出错？如何避免？

## 知识增长 Knowledge Growth

完成后可以把哪些经验、提示词或案例沉淀回知识库？

## Agent Notes

如果以后接 Agent，它应该在用户问"这个挑战怎么做 / 需要什么前置"时检索本条，并一并召回关联的提示词、案例和评价标准。
