# Next Implementation Plan

## Goal

Move the repository from **MVP design workspace** to **validated reference implementation workspace**.

The next phase should prove that the methodology works across three core Agents:

1. Evaluation Agent
2. Coding Coach Agent
3. Project Manager Agent

## Principle

Do not add more abstract structure before validating end-to-end cases.

The priority is:

```text
Case -> Schema -> Automation
```

## Phase 1: Complete Three End-to-End Cases

### Case 1: Evaluation Agent

Status: first draft completed.

Location:

- `examples/challenge-to-cognitive-cell-case/`

What it proves:

```text
Challenge submission
-> Rubric review
-> Evaluation report
-> Knowledge capture
```

Next improvement:

- add one stronger submission example
- add one failed submission example
- compare Evaluation Agent output with human review

### Case 2: Coding Coach Agent

Location to create:

- `examples/coding-coach-agent-case/`

What it should prove:

```text
Student stuck on Challenge
-> Context assembly
-> diagnosis
-> implementation plan
-> README / repo improvement
-> pre-submission check
```

Expected files:

```text
situation.md
context.md
ontology-mapping.md
workflow.md
skills.md
sample-student-problem.md
coach-response.md
pre-submission-check.md
knowledge-capture.md
```

### Case 3: Project Manager Agent

Location to create:

- `examples/project-manager-agent-case/`

What it should prove:

```text
Multiple active Challenges
-> submissions tracked
-> review queue identified
-> blockers summarized
-> weekly report generated
```

Expected files:

```text
situation.md
context.md
ontology-mapping.md
workflow.md
skills.md
sample-challenge-board.md
progress-report.md
knowledge-capture.md
```

## Phase 2: Extract Stable Schemas

After the three cases, extract machine-readable schemas.

Location:

- `schemas/`

Schemas to create:

```text
challenge.schema.yaml
skill.schema.yaml
cognitive-cell.schema.yaml
evaluation-report.schema.yaml
agent-manifest.schema.yaml
```

Purpose:

Make Challenge, Skill, Cognitive Cell, Evaluation Report, and Agent Manifest consistent and eventually machine-checkable.

## Phase 3: Minimal Automation

Only automate after the cases and schemas are stable.

First automation candidates:

1. Check whether required submission files exist.
2. Validate `submission.yaml`.
3. Generate an Evaluation Agent review draft from a GitHub issue or PR.
4. Generate a Project Manager progress summary from GitHub issues.

Possible location:

```text
tools/
  check-submission.js
  generate-review-report.js
  summarize-progress.js
```

## Phase 4: Knowledge Base Growth

Every Challenge should produce reusable knowledge.

Location:

- `knowledge-base/`

Subfolders to create:

```text
knowledge-base/
  faq/
  common-mistakes/
  best-practices/
  prompts/
  examples/
```

## Phase 5: Reference Implementation Milestone

The repository reaches MVP reference implementation status when it has:

- 3 end-to-end Agent cases
- 5 stable schemas
- 1 minimal submission checker
- 1 generated review report
- 1 progress summary
- at least 3 knowledge-base entries

## Immediate Next Task

Build:

```text
examples/coding-coach-agent-case/
```

This will show how the system supports the student before formal evaluation.

