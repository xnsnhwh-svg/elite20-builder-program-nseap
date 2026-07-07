# Challenge Ontology

## Purpose

The Challenge Ontology defines what a Challenge is and how it connects to Skills, Agents, submissions, and assessment.

## Core Classes

| Class | Meaning |
|---|---|
| Challenge | a Builder task that produces reusable output |
| Situation | the real problem or context behind the Challenge |
| LearningObjective | what the Builder should learn |
| SkillTarget | the Skill this Challenge should create or improve |
| AgentCapability | the Agent capability supported by the Challenge |
| SubmissionArtifact | a submitted file, repo, document, demo, or report |
| Rubric | the scoring structure |
| EvaluationReport | review result for a submission |
| KnowledgeEntry | reusable knowledge captured from the Challenge |

## Core Relationships

```text
Challenge originatesFrom Situation
Challenge hasLearningObjective LearningObjective
Challenge targets SkillTarget
Challenge supports AgentCapability
Challenge requires SubmissionArtifact
Challenge evaluatedBy Rubric
SubmissionArtifact reviewedIn EvaluationReport
EvaluationReport mayCreate KnowledgeEntry
KnowledgeEntry improves Challenge
KnowledgeEntry improves SkillTarget
```

## Minimum Challenge Metadata

```yaml
challenge_id:
name:
situation:
learning_objectives:
skill_targets:
agent_capabilities:
required_artifacts:
rubric:
knowledge_capture:
```

## Design Rule

A Challenge should not be treated as only homework.

A Challenge is a production unit for:

- Skill creation
- Agent capability creation
- ontology growth
- knowledge-base growth
- course productization

