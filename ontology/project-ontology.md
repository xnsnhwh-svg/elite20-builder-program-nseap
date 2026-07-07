# Project Ontology

## Purpose

The Project Ontology connects Builder Challenges to real projects, demos, deployment, and productization.

## Core Classes

| Class | Meaning |
|---|---|
| Project | real deliverable or product |
| Stakeholder | user, teacher, enterprise, school, or team |
| Requirement | need or constraint |
| Milestone | project checkpoint |
| Deliverable | artifact to be delivered |
| Demo | presentation or working demonstration |
| Deployment | installation or operational setup |
| Feedback | user, peer, instructor, or agent feedback |

## Core Relationships

```text
Project serves Stakeholder
Project has Requirement
Project contains Milestone
Milestone produces Deliverable
Deliverable demonstratedBy Demo
Project deployedAs Deployment
Feedback improves Project
Challenge contributesTo Project
```

