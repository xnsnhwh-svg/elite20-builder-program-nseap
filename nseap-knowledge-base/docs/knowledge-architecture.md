# Knowledge Architecture

The knowledge base is organized by usage, not by file type.

Each folder represents a major knowledge category used by the NSEAP AI Learning Operating System.

## Categories

| Category | Purpose |
| --- | --- |
| Overview | Explain the knowledge-base system itself. |
| Course | Store course plans, learning objectives, weekly notes, and teacher guidance. |
| Challenges | Store challenge descriptions, deliverables, rubrics, and common mistakes. |
| Prompts | Store reusable prompts for students, teachers, builders, and agents. |
| FAQ | Store common questions and answers. |
| Best Practices | Store reusable methods, standards, and operating principles. |
| Projects | Store project cases, examples, and references. |
| Agents | Store agent context, roles, instructions, and knowledge needs. |

## Metadata

Every reusable knowledge item should include frontmatter metadata:

```yaml
---
id: kb-course-001
title: Week 1 Overview
type: course
audience:
  - student
  - teacher
tags:
  - elite20
  - vibe-coding
status: draft
updated: 2026-06-28
---
```

## Knowledge Quality

A good entry should be:

- Specific enough to use.
- Short enough to scan.
- Structured enough for reuse.
- Clear enough for another team to maintain.
- Metadata-rich enough for future agent retrieval.

