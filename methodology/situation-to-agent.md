# Situation to Agent Methodology

## Purpose

This is the core construction method for Elite20 Builder Program / NSEAP.

The key idea is simple:

```text
Do not start from a prompt.
Start from a Situation.
```

A Task Agent should be produced from a real teaching, learning, project, or business situation.

## Core Flow

```text
Situation
-> Context
-> Ontology
-> Workflow
-> Skill
-> Task Agent
-> Evaluation
-> Knowledge Growth
```

## Step 1: Situation

A Situation describes the real-world problem.

Good Situation statements answer:

- Who is involved?
- What are they trying to do?
- Where do they get stuck?
- What decision or action is needed?
- What evidence proves the task is completed?

Example:

```text
A student has submitted a Challenge repository.
The instructor needs to know whether it is complete, reusable, and aligned with the Rubric.
The review should be fast, consistent, and explainable.
```

This Situation can become the Evaluation Agent.

## Step 2: Context

Context is the information the Agent needs at runtime.

For an Evaluation Agent, context may include:

- Challenge document
- Rubric
- `submission.yaml`
- repository files
- README
- AI log
- reflection
- peer review notes

## Step 3: Ontology

Ontology defines the concepts and relationships in the Situation.

For an Evaluation Agent:

```text
Challenge
-> requires
SubmissionArtifact

SubmissionArtifact
-> providesEvidenceFor
Skill

Rubric
-> evaluates
SubmissionArtifact

EvaluationReport
-> contains
Score
```

## Step 4: Workflow

Workflow defines the steps.

Example Evaluation workflow:

```text
Read Challenge
-> Read Rubric
-> Inspect submission
-> Check required files
-> Evaluate each rubric dimension
-> Generate score
-> Generate revision suggestions
-> Mark status
-> Recommend knowledge capture if strong
```

## Step 5: Skill

A Skill is a reusable capability extracted from the workflow.

Example Skills:

- Repo Completeness Check
- README Quality Review
- AI Log Review
- Rubric Scoring
- Revision Suggestion Generation

## Step 6: Task Agent

A Task Agent packages identity, capability, workflow, skills, input, output, and interface.

Example:

```text
Evaluation Agent
  identity: challenge-reviewer
  capability: evaluate Challenge submissions
  inputs: Challenge, Rubric, submission files
  outputs: Evaluation Report
  skills: Repo Check, Rubric Scoring, Feedback Generation
```

## Step 7: Evaluation

The Agent itself must also be evaluated.

Evaluation questions:

- Did it find missing files?
- Did it apply the Rubric consistently?
- Were the revision suggestions useful?
- Did the instructor agree with the result?
- Can the review be reused as a learning example?

## Builder Rule

For Phase II, a Challenge is not complete when an artifact is submitted.

A Challenge is complete when its result can help future builders by becoming one or more of:

- reusable example
- Skill
- Agent capability
- ontology update
- knowledge-base entry
- improved template

