# Skill Ontology

## Purpose

The Skill Ontology defines reusable capabilities produced by Builders and used by Agents.

## Core Classes

| Class | Meaning |
|---|---|
| Skill | reusable capability |
| SkillInput | required input data |
| SkillOutput | produced output |
| SkillWorkflow | execution steps |
| SkillEvaluation | how the Skill is tested |
| SkillVersion | versioned state of a Skill |
| Tool | external tool, API, CLI, or model used |
| Agent | Agent that can execute or use the Skill |

## Core Relationships

```text
Skill hasInput SkillInput
Skill produces SkillOutput
Skill follows SkillWorkflow
Skill evaluatedBy SkillEvaluation
Skill uses Tool
Skill executedBy Agent
Skill hasVersion SkillVersion
Challenge produces Skill
```

## Skill Metadata Schema

```yaml
skill_id:
name:
purpose:
owner:
inputs:
outputs:
workflow:
tools:
preconditions:
evaluation:
version:
examples:
```

## Example

```yaml
skill_id: repo-completeness-check
name: Repo Completeness Check
purpose: Check whether a Challenge submission has all required files.
inputs:
  - challenge_requirements
  - repository_file_tree
outputs:
  - completeness_status
  - missing_files
  - suggestions
executed_by:
  - Evaluation Agent
```

