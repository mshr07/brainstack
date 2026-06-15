# Dummy Jira Ticket Data

This folder contains generated Jira-like fixture data for local analysis, retrieval, and chatbot tests.

Run:

```bash
python3 scripts/generate_dummy_jira_tickets.py
```

Generated files:

- `dummy_jira_tickets.json`: full nested ticket data for RAG ingestion.
- `dummy_jira_tickets.csv`: flattened ticket data for quick spreadsheet-style analysis.

The fixture includes cases for blocked work, high-priority unresolved tickets, stale caches, repeated failures, missing assignees, missing acceptance criteria, long inactivity, token budget issues, and hallucination-risk answers.

Useful sample questions:

- Which critical tickets are unresolved?
- Which tickets are blocked and why?
- What is the status of AICB-104?
- Which tickets have missing assignees?
- Which tickets look stale or inactive?
- Which tickets are related to hallucination risk?
- Suggest a solution for AICB-110 based only on ticket data.
