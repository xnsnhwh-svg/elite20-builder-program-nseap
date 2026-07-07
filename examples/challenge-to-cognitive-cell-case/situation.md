# Situation

## Situation Statement

A student has submitted a GitHub repository for an Elite20 Challenge.

The instructor needs to know:

- whether the submission is complete
- whether it follows the Challenge requirements
- whether the README is understandable
- whether the AI collaboration process is recorded
- whether the reflection is useful
- whether the work can become a reusable example

Manual review is possible, but inconsistent and time-consuming.

## Why This Situation Matters

Elite20 Phase II needs many Builders to submit many Challenge artifacts.

If every submission is reviewed differently, the system cannot grow into a reusable learning operating system.

The Evaluation Agent exists to make review:

- faster
- more consistent
- more explainable
- easier to improve
- easier to turn into knowledge

## Target Cognitive Cell

```yaml
cell_id: evaluation-agent-cell
cell_type: Evolutionary Cognitive Cell
identity: Evaluation Agent
capability:
  - inspect Challenge submissions
  - apply Rubric
  - generate evaluation report
  - identify knowledge-base candidates
interface:
  inputs:
    - Challenge document
    - Rubric
    - submission repo
    - AI log
    - reflection
  outputs:
    - evaluation-report.md
    - revision suggestions
    - review status
    - knowledge capture suggestions
```

