# Knowledge Cognitive Cell MVP Scope

## MVP Goal

Build the first usable Knowledge Cognitive Cell structure for the NSEAP AI Learning Operating System.

The MVP should prove that project knowledge can be organized, displayed, searched, submitted, reviewed, reused, and prepared for future agent retrieval and Cognitive Cell evolution.

This version treats the Knowledge Base as a Static Cognitive Cell first. It provides stable knowledge assets, a standard interface, and a lightweight demo app. Later, it can evolve into a Knowledge Librarian Agent with long-term memory, evaluation, and KSTAR-based improvement.

## Product MVP

The MVP now includes a lightweight frontend-backend demo.

The backend uses a local JSON database in `data/knowledge-db.json`. The first database seed contains one real project case: the C2S big-data challenge case. The frontend in `app/index.html` loads knowledge entries from `/api/knowledge` first, uses `/api/search` for backend search, and falls back to embedded static data only when the API is unavailable.

The app demonstrates:

- Knowledge entry browsing.
- Category filtering.
- Search across title, tags, concepts, skills, and audience.
- Real project case retrieval, including the C2S big-data challenge case.
- Entry detail view.
- Metadata inspection.
- Relationship inspection.
- Knowledge Growth Flow visualization.
- Links back to source Markdown files.
- Backend API retrieval.
- Backend API search.
- Local JSON database persistence for newly submitted draft knowledge.

## In Scope

- Static demo app.
- Lightweight Node.js backend.
- Local JSON knowledge database.
- Knowledge-base folder structure.
- Standard metadata for knowledge entries.
- Templates for common knowledge types.
- Sample entries for course, challenge, prompt, FAQ, best practice, project, and agent knowledge.
- A real C2S big-data project case and a Metadata-First best practice extracted from that case.
- GitHub contribution workflow.
- Builder Workflow mapping.
- Basic JSON schemas.
- Cognitive Cell alignment.
- Agent-ready and KSTAR-ready design explanation.

## Out of Scope for Version 1

- Full course content migration.
- Full website or LMS integration.
- User login or permissions.
- Backend API.
- Complex production backend API.
- Production database.
- Vector database implementation.
- Complex knowledge graph implementation.
- Automated grading system.
- Complete prompt library.
- Complete video library.
- Fully autonomous Knowledge Librarian Agent.

## Success Criteria

Version 1 is successful when another builder can:

1. Open the demo app and browse knowledge entries.
2. Filter or search entries.
3. Understand the Knowledge Base as a Knowledge Cognitive Cell.
4. Find the correct folder for a new knowledge item.
5. Use a template to create a new entry.
6. Add metadata that humans and agents can understand.
7. Submit the entry through a GitHub workflow.
8. Explain how this MVP maps to Identity, Capability, Interface, and FDE Workbench.

## Demo Script

For the first demo, show:

1. Run `npm run dev`.
2. Open `http://127.0.0.1:8787/index.html`.
3. Explain that the frontend is reading from `/api/knowledge`, not from hardcoded HTML.
4. Show that the database currently contains one real C2S big-data project case.
5. Search for `大数据` and show that `/api/search` returns the C2S project case.
6. Search for `Metadata-First` and show that the same real project case is discoverable through metadata.
7. Open the C2S project case and show metadata, concepts, skills, relationships, and Knowledge Growth Flow.
8. Explain that future real examples can be inserted through the same data schema or POST API.
9. Show `docs/builder-workflow.md`.
10. Show the future Knowledge Librarian Agent idea.
