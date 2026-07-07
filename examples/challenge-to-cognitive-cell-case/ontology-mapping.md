# Ontology Mapping

## Core Entities

| Entity | Example |
|---|---|
| Challenge | C01 Build a Challenge Submission Repo |
| Situation | Student submitted a repo and needs review |
| Skill | Repo Completeness Check |
| Agent | Evaluation Agent |
| Rubric | Standard 100-point Rubric |
| SubmissionArtifact | README, submission.yaml, AI log, reflection |
| EvaluationReport | evaluation-report.md |
| KnowledgeEntry | FAQ update, best practice, common mistake |

## Relationships

```text
Challenge originatesFrom Situation
Challenge requires SubmissionArtifact
Challenge evaluatedBy Rubric
SubmissionArtifact providesEvidenceFor Skill
Evaluation Agent executes Skill
Evaluation Agent generates EvaluationReport
EvaluationReport contains Score
EvaluationReport mayCreate KnowledgeEntry
KnowledgeEntry improves future Challenge
```

## YAML View

```yaml
challenge:
  id: C01
  name: Build a Challenge Submission Repo
  originates_from: student_submission_review_situation
  requires:
    - README.md
    - submission.yaml
    - ai-log.md
    - reflection.md
  evaluated_by: standard_challenge_rubric

skills:
  - repo-completeness-check
  - readme-quality-review
  - ai-log-review
  - rubric-scoring
  - feedback-generation

agent:
  id: evaluation-agent
  executes:
    - repo-completeness-check
    - rubric-scoring
    - feedback-generation

knowledge_capture:
  outputs:
    - common_mistake
    - faq_entry
    - reusable_example
```

