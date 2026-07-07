# MVP Roadmap

## MVP Goal

The MVP goal is to make Elite20 Phase II run as a Builder Operating System before building a full LMS.

The first working system should prove this loop:

```text
Challenge
-> GitHub submission
-> Coding Coach pre-check
-> Peer review
-> Evaluation Agent review
-> Instructor confirmation
-> Knowledge capture
```

## Phase 0: Operating Rules

Outcome: everyone knows how Challenges, submissions, and reviews work.

Deliverables:

- Challenge template
- Rubric template
- Submission template
- review process
- contribution guide
- first sample Challenge

Success criteria:

- one instructor can publish a Challenge using the template
- one student can understand what to submit
- one reviewer can score using the Rubric

## Phase 1: Manual GitHub Workflow

Outcome: run the full workflow manually on GitHub.

Deliverables:

- GitHub repo structure
- issue template
- pull request template
- submission checklist
- first review report format

Success criteria:

- at least 3 student submissions can be reviewed in the same format
- review records are visible in GitHub
- strong submissions can be copied into the knowledge base

## Phase 2: Agent-Assisted Workflow

Outcome: the first three agents start supporting the workflow.

Deliverables:

- Project Manager Agent prompt / spec
- Coding Coach Agent prompt / spec
- Evaluation Agent prompt / spec
- agent collaboration flow
- structured review report

Success criteria:

- Project Manager Agent can summarize progress
- Coding Coach Agent can help a student self-check
- Evaluation Agent can score one submission with the Rubric

## Phase 3: Knowledge Capture

Outcome: good submissions and repeated problems become reusable knowledge.

Deliverables:

- examples index
- FAQ updates
- common mistakes list
- reusable prompt / skill library
- best submission gallery

Success criteria:

- each Challenge produces at least one reusable example
- repeated problems are turned into FAQ entries
- good workflows are turned into Skills or agent instructions

## Phase 4: Platform Extension

Outcome: decide what should become a real platform.

Possible extensions:

- documentation portal
- dashboard
- LMS integration
- Feishu / WeChat notification bridge
- automated GitHub checks
- agent service backend

Rule:

Only build platform features after the GitHub-based workflow proves what needs automation.

