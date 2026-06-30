# Elite20 Builder Program / NSEAP

Elite20 Builder Program / NSEAP is the MVP design repository for AI+X Phase II.

The first goal is not to build a full LMS. The first goal is to make the Builder workflow run and turn each Challenge into reusable Skills, Task Agents, ontology updates, and knowledge assets.

```text
Situation -> Ontology -> Workflow -> Skill -> Task Agent -> Evaluation -> Knowledge Growth
```

## What This Repository Contains

- `docs/`: vision, workflow, and operating model
- `standards/`: mapping between Richard's reference documents and this repository
- `methodology/`: Situation-to-Agent, FDE workflow, Skill construction, and KSTAR loop
- `ontology/`: Course, Skill, Challenge, Project, and Assessment ontology drafts
- `challenges/`: standard Challenge, Rubric, and submission templates
- `agents/`: specifications for the first three task agents
- `agents/manifests/`: MVP agent manifests aligned with the LLM Agent Interface direction
- `examples/`: end-to-end cases that show how a Challenge becomes a Cognitive Cell
- `teams/`: seven Builder Team workspaces aligned with Richard's team structure
- `knowledge-base/`: examples, FAQ, prompts, and reusable lessons
- `governance/`: contribution and review rules

## MVP Scope

The MVP now focuses on four layers:

1. Builder Workflow: how tasks are designed, submitted, reviewed, and released.
2. FDE Methodology: how a Situation becomes Ontology, Workflow, Skill, and Task Agent.
3. Ontology Layer: how Course, Skill, Challenge, Project, and Assessment connect.
4. Agent Interface Layer: how Agents declare identity, capability, inputs, outputs, and permissions.

## First Three Agents

- Project Manager Agent: tracks progress and coordinates work.
- Coding Coach Agent: helps students build, debug, and document.
- Evaluation Agent: reviews submissions according to rubrics.

## Communication Channels

- WeChat / Feishu / Xuexitong: daily communication, notification, and teaching management.
- GitHub: formal Challenge publication, submission, review, documentation, and knowledge capture.

## Current File Map

Start here:

- `standards/standards-mapping.md`: how Richard's reference documents map to this repository
- `docs/next-implementation-plan.md`: next steps toward reference implementation
- `methodology/situation-to-agent.md`: the core Situation -> Agent construction method
- `docs/vision.md`: what Elite20 Builder OS is for
- `docs/workflow.md`: the main operating workflow
- `docs/mvp-roadmap.md`: phased MVP plan
- `docs/progress-report.md`: Chinese project progress report for group sharing
- `docs/phase1-background-summary.md`: Phase I background and lessons from the chat logs
- `teams/team-roadmap.md`: seven-team responsibility and folder map
- `teams/github-submission-guide.md`: whether to use this repo or separate team repos
- `ontology/challenge-ontology.md`: how Challenge connects to Skill, Agent, Rubric, and Knowledge
- `challenges/challenge-template.md`: standard Challenge format
- `challenges/rubric-template.md`: standard scoring format
- `challenges/sample-challenge-01.md`: first sample Challenge
- `agents/agent-collaboration-flow.md`: how the first three agents work together
- `agents/manifests/`: machine-readable MVP Agent manifests
- `examples/challenge-to-cognitive-cell-case/`: first end-to-end example
- `.github/ISSUE_TEMPLATE/`: GitHub issue templates for Challenges and submissions
- `reviews/evaluation-report-template.md`: standard review report format
- `prompts/`: reusable prompts for the first three agents
