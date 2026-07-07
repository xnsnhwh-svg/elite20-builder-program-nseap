# Builder Team Roadmap

## Purpose

This folder maps Richard's seven Builder Teams into the repository structure.

The goal is to make it clear:

- which team owns which part
- where each team should place MVP work
- how team outputs connect back to the NSEAP Builder workflow

## Seven Builder Teams

| Team | Responsibility | Main Folder | Expected MVP Output |
|---|---|---|---|
| Team 1 Curriculum Team | redesign the course | `teams/curriculum-team/` | syllabus, weekly plan, lecture notes, slides, labs, assignments |
| Team 2 Challenge Team | design all Challenges | `teams/challenge-team/` | Challenge Catalog, Rubrics, Evaluation standards |
| Team 3 Agent Team | develop course Agents | `teams/agent-team/` | Companion, Tutor, Reviewer, Project Manager, Evaluation, Coding Coach |
| Team 4 Ontology Team | build ontology and knowledge graph | `teams/ontology-team/` | Skill Ontology, Learning Ontology, Knowledge Graph, schemas |
| Team 5 Platform Team | build platform and deployment path | `teams/platform-team/` | GitHub workflow, website, LMS plan, deployment guide |
| Team 6 Knowledge Team | organize reusable knowledge | `teams/knowledge-team/` | documentation, tutorials, prompt library, videos, best practices |
| Team 7 Demo Team | prepare demonstration and communication | `teams/demo-team/` | website demo, demo video, presentation, promotion materials |

## How Team Work Connects To The Main Repository

Each team may work in its own folder, but the final output should connect to the shared system:

```text
Team Output
-> Challenge / Skill / Agent / Ontology / Knowledge
-> GitHub submission
-> Peer Review
-> Agent Review
-> Documentation
-> Release
```

## Minimum Team README

Each team folder should maintain a `README.md` with:

```text
1. Team goal
2. Current owner / members
3. MVP deliverables
4. Current task list
5. Submission links
6. Review status
7. Next actions
```

## Recommended First Team Tasks

### Curriculum Team

Create:

- `syllabus/README.md`
- `weekly-plan/week-01.md`
- `lectures/week-01.md`

### Challenge Team

Create:

- `challenge-catalog/README.md`
- `challenge-catalog/C01.md`
- `rubrics/default-rubric.md`

### Agent Team

Create:

- `evaluation-agent/README.md`
- `coding-coach-agent/README.md`
- `project-manager-agent/README.md`

### Ontology Team

Create:

- `skill-ontology/README.md`
- `learning-ontology/README.md`
- `schemas/README.md`

### Platform Team

Create:

- `github/README.md`
- `website/README.md`
- `deployment/README.md`

### Knowledge Team

Create:

- `documentation/README.md`
- `prompt-library/README.md`
- `best-practices/README.md`

### Demo Team

Create:

- `presentation/README.md`
- `demo-video/README.md`
- `promotion/README.md`

