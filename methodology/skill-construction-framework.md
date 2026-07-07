# Skill Construction Framework

## Purpose

A Skill is a reusable capability that can be executed by a human, an Agent, or a system.

In Elite20 Phase II, Skills are the bridge between a Challenge and a Task Agent.

## Skill Lifecycle

```text
Requirement
-> Context
-> Input Schema
-> Output Schema
-> Workflow
-> Test Cases
-> Evaluation
-> Refinement
-> Production
```

## Skill Specification

A Skill should define:

- name
- purpose
- owner
- input schema
- output schema
- preconditions
- workflow steps
- tools or APIs used
- examples
- evaluation criteria
- version

## Example Skill

```yaml
name: repo-completeness-check
purpose: Check whether a Challenge submission contains all required files.
inputs:
  - challenge_requirements
  - repository_file_tree
outputs:
  - missing_files
  - completeness_status
  - suggestions
preconditions:
  - repository is accessible
evaluation:
  - correctly identifies missing required files
  - produces actionable suggestions
```

## Production Rule

A Skill is production-ready only when:

- it has clear inputs and outputs
- it can be tested with examples
- it can be reused across multiple Challenges
- it has evaluation criteria
- it can be improved based on feedback

