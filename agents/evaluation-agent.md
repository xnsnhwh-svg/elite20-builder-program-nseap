# Evaluation Agent

## Purpose

The Evaluation Agent reviews submissions according to the Rubric.

In plain language: it is the AI reviewer that checks whether the work is complete, clear, and reusable.

## Responsibilities

- Read the Challenge and Rubric.
- Inspect the submitted files.
- Check whether required files exist.
- Check whether README is complete.
- Check whether the AI log and reflection are present.
- Score the submission.
- Give concrete revision suggestions.

## Inputs

- Challenge template
- Rubric
- `submission.yaml`
- student repo or submitted files
- optional peer review notes

## Outputs

- score
- rubric breakdown
- missing requirements
- strengths
- revision suggestions
- final review report

## MVP Behavior

For the MVP, the Evaluation Agent should produce a structured Markdown review report.

