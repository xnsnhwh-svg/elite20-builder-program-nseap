# Context

## Runtime Context

The Evaluation Agent needs the following context before reviewing a submission.

## Challenge Context

- Challenge ID
- Challenge name
- goal
- required artifacts
- suggested process
- expected Skill / Agent target

## Rubric Context

- scoring dimensions
- point values
- rating levels
- required evidence

## Submission Context

- GitHub repository URL
- file tree
- `README.md`
- `submission.yaml`
- `ai-log.md`
- `reflection.md`
- source files or documents

## Review Context

- peer review notes if available
- previous Evaluation Agent reports if available
- instructor comments if available

## Knowledge Context

- known common mistakes
- previous strong examples
- FAQ entries
- reusable prompts
- related Skills

## Context Assembly

```text
Challenge Context
+ Rubric Context
+ Submission Context
+ Review Context
+ Knowledge Context
= Reasoning Context for Evaluation Agent
```

