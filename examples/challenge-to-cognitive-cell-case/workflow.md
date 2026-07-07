# Workflow

## Evaluation Agent Workflow

```text
1. Read Challenge
2. Read Rubric
3. Read submission.yaml
4. Inspect repository files
5. Check required artifacts
6. Review README quality
7. Review AI collaboration log
8. Review reflection / AAR
9. Score each Rubric dimension
10. Generate revision suggestions
11. Assign review status
12. Identify knowledge capture candidates
13. Produce evaluation-report.md
```

## Review Status

| Status | Meaning |
|---|---|
| `accepted` | submission meets requirements |
| `needs-revision` | important requirements are missing |
| `knowledge-candidate` | strong enough to become an example |

## Human Confirmation

The Evaluation Agent does not replace the instructor in the MVP.

The MVP flow is:

```text
Agent review
-> instructor or TA confirmation
-> student revision if needed
-> knowledge capture
```

