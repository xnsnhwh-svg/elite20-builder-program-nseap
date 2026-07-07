# Standards Mapping

## Purpose

This document explains how the reference documents shared by Richard map to the Elite20 Builder Program / NSEAP MVP repository.

The repository started as a GitHub-based Builder workflow. After reviewing the four reference documents, the next step is to align the workflow with the larger NSEAP methodology and standards direction.

## Big Picture

```text
Challenge / GitHub / Review workflow
-> FDE methodology
-> Ontology and knowledge graph
-> Agent interface and manifest
-> NSEAP reference implementation
```

## Reference Document Mapping

| Reference | Main Meaning | Repository Mapping |
|---|---|---|
| `Tech-discussions.docx` | FDE implementation methodology: Situation -> Ontology -> Workflow -> Skill -> Task Agent -> Evaluation | `methodology/`, upgraded Challenge template, Skill construction flow |
| `3428 draft.docx` | Adaptive Agent Model Framework for education: learners, teachers, AI agents, ontology, and learning records | `agents/`, `ontology/`, `knowledge-base/`, future learning records |
| `P2807...docx` | Educational Knowledge Graph and ontology architecture | `ontology/`, Course / Skill / Challenge / Assessment ontology |
| `P3394...docx` | LLM Agent Interface: manifest, message format, session, permission, interoperability | `agents/manifests/`, future message and session specs |

## What This Means For Phase II

The Phase II repository should not remain only a homework submission space.

It should become a Builder system where each Challenge can be transformed into:

- a clear Situation
- an Ontology mapping
- a Workflow
- one or more reusable Skills
- a Task Agent or Agent capability
- an Evaluation method
- reusable Knowledge Base entries

## Four-Layer Repository Model

| Layer | Question It Answers | Current / Planned Location |
|---|---|---|
| Builder Workflow | How do builders publish, submit, review, and release work? | `docs/`, `challenges/`, `.github/`, `reviews/` |
| FDE Methodology | How does a real situation become a Skill or Task Agent? | `methodology/` |
| Ontology Layer | How do Course, Skill, Challenge, Project, and Assessment connect? | `ontology/` |
| Agent Interface Layer | How does each Agent declare identity, capability, input, output, and permission? | `agents/manifests/` |

## Immediate Design Rule

Every new Builder Challenge should answer seven questions:

1. What Situation does this Challenge come from?
2. What Context does the builder need?
3. What Ontology entities are involved?
4. What Workflow should be executed?
5. What Skill can be produced or improved?
6. What Agent role or capability does it support?
7. How will the output be evaluated and reused?

