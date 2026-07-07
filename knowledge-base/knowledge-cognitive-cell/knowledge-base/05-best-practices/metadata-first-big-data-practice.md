---
id: kb-best-practice-003
title: Metadata-First 大数据任务实践
type: best-practice
summary: 面向大数据和数据分析任务的实践规则：先给 AI 数据字典和业务约束，再让 AI 执行清洗、特征工程或分析代码生成。
audience:
  - student
  - teacher
  - builder
  - agent
keywords:
  - Metadata-First
  - 大数据
  - 数据字典
  - 语义对齐
  - 特征工程
  - AI 协作
tags:
  - best-practice
  - big-data
  - metadata
  - ai-collaboration
concepts:
  - 元数据先行
  - 数据语义
  - 业务约束
  - 人机协同建模
skills:
  - 编写数据字典
  - 描述业务规则
  - 审查伪代码
  - 评估 AI 输出
related:
  - kb-project-002
  - kb-prompt-001
relationships:
  - predicate: extractedFrom
    target: kb-project-002
  - predicate: supports
    target: kb-prompt-001
status: sample
updated: 2026-07-01
source: ../../例子/C2S_Final_BigData_Submission/C2S_Submission_V2_BigData.md
---

# Metadata-First 大数据任务实践

## 用途

这条最佳实践用于解决“AI 代码能跑，但业务逻辑错了”的问题。它要求学生在让 AI 处理数据之前，先把字段含义、业务规则、异常边界和目标指标讲清楚。

## 场景 Situation

在大数据应用、数据清洗、特征工程和分析建模中，AI 经常因为缺少业务语义而误解字段。例如价格字段不能为负、用户状态有枚举值、缺失值处理方式和业务目标有关。如果直接让 AI 写代码，结果可能语法正确但不可用。

## 本体 / 结构说明

这个实践包含五个对象：

- 数据字段：字段名、含义、类型、单位。
- 业务约束：哪些值合法，哪些值异常。
- 任务目标：要清洗、预测、分类还是生成报告。
- AI 行动：根据元数据生成代码或分析步骤。
- 人类审查：检查输出是否符合业务逻辑。

## 流程 Workflow

```text
列出字段
-> 写出字段含义和单位
-> 标注合法值和异常值
-> 说明任务目标
-> 先让 AI 写伪代码
-> 人类审查逻辑
-> 再让 AI 生成正式代码
-> 复盘 Prompt 数量和错误类型
```

## 技能 Skill

学生需要练习三类能力：

- 元数据表达：把字段和业务约束讲清楚。
- 逻辑审查：先看伪代码是否合理，再看代码是否能跑。
- 协作复盘：记录 AI 哪些地方帮到了，哪些地方需要人类判断。

## 实践 Checklist

- 是否提供了字段名、含义、类型和单位。
- 是否说明了异常值、缺失值和边界条件。
- 是否明确告诉 AI 当前任务目标。
- 是否先审查伪代码，再生成正式代码。
- 是否记录了 AI 输出错误的原因。
- 是否在 AAR 中总结下一次如何减少无效 Prompt。

## 评估 Evaluation

如果使用这条实践后，AI 生成的代码更少出现业务语义错误，学生能更快发现逻辑问题，并能在 AAR 中说清楚改进点，就说明这条实践是有效的。

## 知识增长 Knowledge Growth

这条实践可以继续扩展为数据字典模板、数据分析 Prompt 模板、伪代码审查清单和大数据项目 FAQ。

## Agent Notes

当用户问“AI 为什么听不懂我的数据分析需求”“大数据任务怎么写 Prompt”“怎么减少 AI 生成无效代码”时，应优先召回本条。
