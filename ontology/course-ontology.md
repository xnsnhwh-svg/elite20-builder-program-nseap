# Course Ontology

## Purpose

The Course Ontology connects curriculum content to Challenges, Skills, Agents, and assessments.

## Core Classes

| Class | Meaning |
|---|---|
| Course | complete AI-native course |
| Module | course unit or week |
| Lesson | teachable session |
| LearningObjective | learning target |
| Challenge | Builder task |
| Skill | reusable capability |
| Resource | lecture, slide, reading, repo, video, prompt |
| Assessment | evaluation method |

## Core Relationships

```text
Course contains Module
Module contains Lesson
Lesson supports LearningObjective
Challenge assesses LearningObjective
Challenge produces Skill
Resource supports Lesson
Assessment evaluates Challenge
```

