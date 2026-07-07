# Agent Collaboration Flow

## Purpose

This document explains how the first three agents work together in Elite20 Builder OS.

The first three agents are:

- Project Manager Agent
- Coding Coach Agent
- Evaluation Agent

## Simple Version

```text
Project Manager Agent: keeps the class moving
Coding Coach Agent: helps the student improve before submission
Evaluation Agent: reviews the final submission against the Rubric
```

## Full Workflow

```text
Instructor publishes Challenge
-> Project Manager Agent creates task list and review queue
-> Student starts work
-> Coding Coach Agent helps plan, debug, and self-check
-> Student submits through GitHub
-> Project Manager Agent detects submission
-> Peer reviewer gives comments
-> Evaluation Agent scores with Rubric
-> Instructor confirms result
-> Knowledge Librarian process captures reusable parts
```

## Responsibilities

| Stage | Main Owner | Agent Support |
|---|---|---|
| Challenge release | Instructor | Project Manager Agent |
| Planning | Student | Coding Coach Agent |
| Building | Student | Coding Coach Agent |
| Self-check | Student | Coding Coach Agent |
| Submission tracking | Instructor / TA | Project Manager Agent |
| Peer review | Peer reviewer | Project Manager Agent |
| Formal review | Instructor | Evaluation Agent |
| Knowledge capture | Builder team | Evaluation Agent + future Knowledge Agent |

## Handoff Rules

### Project Manager Agent to Coding Coach Agent

When a student starts a Challenge, Project Manager Agent should provide:

- Challenge ID
- due date
- required submission files
- relevant rubric
- current status

### Coding Coach Agent to Evaluation Agent

Before formal review, Coding Coach Agent should help the student produce:

- complete README
- complete `submission.yaml`
- AI log
- reflection
- runnable or inspectable artifact
- known limitations

### Evaluation Agent to Project Manager Agent

After review, Evaluation Agent should return:

- score
- review status
- missing requirements
- revision suggestions
- whether the submission can become a knowledge-base example

## Review Status

Use these status labels:

| Status | Meaning |
|---|---|
| `not-started` | student has not started |
| `in-progress` | student is building |
| `self-check` | student is checking before submission |
| `submitted` | ready for peer review |
| `peer-reviewed` | peer review is complete |
| `agent-reviewed` | Evaluation Agent has reviewed |
| `needs-revision` | student must revise |
| `accepted` | instructor accepted |
| `knowledge-candidate` | worth adding to examples |

## MVP Rule

Agents do not need to be fully automated at first.

In the MVP, each agent can start as:

- a Markdown spec
- a reusable prompt
- a checklist
- a manually triggered review workflow

Automation should come after the workflow becomes stable.

