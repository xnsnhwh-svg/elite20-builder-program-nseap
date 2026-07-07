# Assessment Ontology

## Purpose

The Assessment Ontology defines how Builder work is evaluated.

## Core Classes

| Class | Meaning |
|---|---|
| Rubric | scoring standard |
| RubricDimension | one scoring dimension |
| Score | numeric or qualitative result |
| Evidence | artifact or behavior supporting a score |
| Feedback | review comment |
| RevisionSuggestion | concrete improvement action |
| ReviewStatus | accepted, needs revision, knowledge candidate, etc. |
| Evaluator | human reviewer or Evaluation Agent |

## Core Relationships

```text
Rubric contains RubricDimension
RubricDimension scoredBy Score
Score supportedBy Evidence
EvaluationReport contains Feedback
Feedback mayInclude RevisionSuggestion
EvaluationReport assignedBy Evaluator
EvaluationReport hasStatus ReviewStatus
```

## Default Rubric Dimensions

| Dimension | Points |
|---|---:|
| Task completion | 30 |
| AI collaboration process | 20 |
| GitHub / file structure | 15 |
| Documentation quality | 15 |
| Reflection / AAR | 10 |
| Reusable value | 10 |

## Review Status Values

```text
submitted
peer-reviewed
agent-reviewed
needs-revision
accepted
knowledge-candidate
```

