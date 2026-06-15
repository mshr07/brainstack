#!/usr/bin/env python3
"""Generate deterministic dummy Jira tickets for local analysis and RAG tests."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any


PROJECT_KEY = "AICB"


def comment(author: str, body: str, created_at: str) -> dict[str, str]:
    return {
        "author": author,
        "body": body,
        "created_at": created_at,
    }


def ticket(
    *,
    key: str,
    issue_type: str,
    summary: str,
    description: str,
    status: str,
    priority: str,
    assignee: str | None,
    reporter: str,
    labels: list[str],
    components: list[str],
    sprint: str | None,
    created_at: str,
    updated_at: str,
    due_date: str | None,
    resolution: str | None,
    story_points: int | None,
    environment: str,
    acceptance_criteria: list[str],
    comments: list[dict[str, str]],
    linked_issues: list[dict[str, str]] | None = None,
    custom_fields: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "key": key,
        "project": PROJECT_KEY,
        "issue_type": issue_type,
        "summary": summary,
        "description": description,
        "status": status,
        "priority": priority,
        "assignee": assignee,
        "reporter": reporter,
        "labels": labels,
        "components": components,
        "sprint": sprint,
        "created_at": created_at,
        "updated_at": updated_at,
        "due_date": due_date,
        "resolution": resolution,
        "story_points": story_points,
        "environment": environment,
        "acceptance_criteria": acceptance_criteria,
        "comments": comments,
        "linked_issues": linked_issues or [],
        "custom_fields": custom_fields or {},
    }


def make_tickets() -> list[dict[str, Any]]:
    return [
        ticket(
            key="AICB-101",
            issue_type="Bug",
            summary="Chatbot returns ticket answers without citations",
            description=(
                "When users ask for a status summary, the assistant sometimes answers with ticket facts "
                "but omits the source ticket IDs. Compliance review requires every ticket claim to cite "
                "the ticket key."
            ),
            status="In Progress",
            priority="Critical",
            assignee="Maya Chen",
            reporter="Ravi Kumar",
            labels=["rag", "citations", "hallucination-risk"],
            components=["answer-generation", "prompting"],
            sprint="Sprint 24",
            created_at="2026-05-20T09:15:00Z",
            updated_at="2026-06-14T16:45:00Z",
            due_date="2026-06-18",
            resolution=None,
            story_points=5,
            environment="production",
            acceptance_criteria=[
                "Every Jira-related answer includes at least one ticket key citation.",
                "If retrieved context has no supporting ticket, the assistant says there is not enough information.",
                "Regression tests cover general questions and specific ticket questions.",
            ],
            comments=[
                comment(
                    "Ava Patel",
                    "Observed in five of twelve sampled answers from production logs.",
                    "2026-06-12T10:20:00Z",
                ),
                comment(
                    "Maya Chen",
                    "Prompt guard is added locally. Need retrieval tests before merge.",
                    "2026-06-14T16:45:00Z",
                ),
            ],
            linked_issues=[{"key": "AICB-110", "type": "relates to"}, {"key": "AICB-118", "type": "relates to"}],
            custom_fields={
                "severity": "S1",
                "customer_impact": "High - compliance review failed",
                "root_cause_hypothesis": "Prompt permits uncited synthesis when context contains multiple tickets.",
            },
        ),
        ticket(
            key="AICB-102",
            issue_type="Story",
            summary="Implement Jira API pagination for ticket sync",
            description=(
                "The sync job previously fetched only the first page of Jira search results. Add pagination "
                "using the startAt and maxResults fields until all issues for the project are fetched."
            ),
            status="Done",
            priority="High",
            assignee="Jordan Lee",
            reporter="Priya Nair",
            labels=["jira-sync", "pagination"],
            components=["jira-client", "ingestion"],
            sprint="Sprint 23",
            created_at="2026-05-05T08:30:00Z",
            updated_at="2026-05-29T11:10:00Z",
            due_date="2026-05-30",
            resolution="Done",
            story_points=3,
            environment="staging",
            acceptance_criteria=[
                "Sync fetches all pages until total results are exhausted.",
                "Logs include total fetched ticket count.",
                "Unit test mocks three pages of Jira responses.",
            ],
            comments=[
                comment("Jordan Lee", "Pagination merged and verified against staging project AICB.", "2026-05-28T15:00:00Z"),
                comment("Priya Nair", "QA confirmed 362 tickets synced instead of 50.", "2026-05-29T11:10:00Z"),
            ],
            custom_fields={"severity": "S2", "customer_impact": "Medium - historical tickets were missing from analysis"},
        ),
        ticket(
            key="AICB-103",
            issue_type="Task",
            summary="Add embedding cache invalidation when tickets are updated",
            description=(
                "Embeddings are reused even after a Jira ticket description or comments change. Cache keys should "
                "include the ticket updated_at value and a content fingerprint."
            ),
            status="To Do",
            priority="High",
            assignee=None,
            reporter="Maya Chen",
            labels=["embeddings", "cache", "stale-data"],
            components=["retrieval", "cache"],
            sprint="Sprint 25",
            created_at="2026-06-01T12:30:00Z",
            updated_at="2026-06-01T12:30:00Z",
            due_date="2026-06-25",
            resolution=None,
            story_points=5,
            environment="development",
            acceptance_criteria=[
                "Unchanged tickets reuse existing embeddings.",
                "Changed tickets regenerate embeddings on the next sync.",
                "Cache invalidation is covered by unit tests.",
            ],
            comments=[
                comment("Maya Chen", "This is currently unassigned and blocks reliable stale-index analysis.", "2026-06-01T12:45:00Z"),
            ],
            custom_fields={
                "severity": "S2",
                "customer_impact": "Medium - users can receive answers from outdated ticket text",
                "blocked_reason": "Needs owner assignment",
            },
        ),
        ticket(
            key="AICB-104",
            issue_type="Bug",
            summary="Vector index returns stale ticket status after Jira transition",
            description=(
                "After AICB-087 moved from In Progress to Done, search results continued to show the old status "
                "for two hours. The vector index was rebuilt manually to resolve the mismatch."
            ),
            status="Blocked",
            priority="Critical",
            assignee="Noah Singh",
            reporter="Elena Brooks",
            labels=["vector-index", "stale-data", "blocked"],
            components=["retrieval", "indexer"],
            sprint="Sprint 24",
            created_at="2026-05-26T14:00:00Z",
            updated_at="2026-06-10T09:40:00Z",
            due_date="2026-06-17",
            resolution=None,
            story_points=8,
            environment="production",
            acceptance_criteria=[
                "Status transitions trigger index refresh for the changed ticket.",
                "Search results never show an older status than Jira API data.",
                "Indexer logs include changed ticket keys.",
            ],
            comments=[
                comment("Noah Singh", "Root cause points to missing status in the content hash.", "2026-06-07T13:25:00Z"),
                comment("Elena Brooks", "Redis write access is still pending from platform team.", "2026-06-10T09:40:00Z"),
            ],
            linked_issues=[{"key": "AICB-103", "type": "blocks"}],
            custom_fields={
                "severity": "S1",
                "customer_impact": "High - executives saw stale completion status",
                "blocked_reason": "Waiting for Redis write access in production",
                "external_dependency": "Platform team",
            },
        ),
        ticket(
            key="AICB-105",
            issue_type="Spike",
            summary="Evaluate hybrid keyword and vector retrieval for Jira questions",
            description=(
                "Research whether BM25 keyword retrieval combined with vector similarity improves ticket recall "
                "for IDs, component names, labels, and broad semantic questions."
            ),
            status="In Review",
            priority="Medium",
            assignee="Sam Rivera",
            reporter="Ravi Kumar",
            labels=["retrieval", "hybrid-search", "evaluation"],
            components=["retrieval"],
            sprint="Sprint 24",
            created_at="2026-05-28T10:10:00Z",
            updated_at="2026-06-13T18:00:00Z",
            due_date="2026-06-19",
            resolution=None,
            story_points=3,
            environment="development",
            acceptance_criteria=[
                "Compare vector-only and hybrid retrieval on at least 40 labeled queries.",
                "Document precision and recall tradeoffs.",
                "Recommend default top_k and reranking settings.",
            ],
            comments=[
                comment("Sam Rivera", "Initial hybrid run improved exact component questions by 18 percent.", "2026-06-11T17:00:00Z"),
                comment("Ravi Kumar", "Please include ticket ID direct lookup in the evaluation table.", "2026-06-13T18:00:00Z"),
            ],
            custom_fields={"severity": "S3", "customer_impact": "Low - evaluation only"},
        ),
        ticket(
            key="AICB-106",
            issue_type="Bug",
            summary="Direct ticket lookup fails for lowercase ticket keys",
            description=(
                "A query such as 'what is wrong with aicb-104' does not trigger direct lookup. The key extractor "
                "only matches uppercase project keys."
            ),
            status="Open",
            priority="High",
            assignee="Lina Gomez",
            reporter="Priya Nair",
            labels=["ticket-id", "lookup", "parser"],
            components=["query-routing", "retrieval"],
            sprint="Sprint 24",
            created_at="2026-06-03T07:45:00Z",
            updated_at="2026-06-09T15:30:00Z",
            due_date="2026-06-21",
            resolution=None,
            story_points=2,
            environment="production",
            acceptance_criteria=[
                "Ticket key extraction is case-insensitive.",
                "Specific ticket queries bypass semantic search when the ticket exists.",
                "Invalid ticket IDs return a friendly not-found message.",
            ],
            comments=[
                comment("Lina Gomez", "Regex fix is small, but tests need examples for lowercase and mixed case.", "2026-06-09T15:30:00Z"),
            ],
            custom_fields={"severity": "S2", "customer_impact": "Medium - users receive broad answers instead of exact tickets"},
        ),
        ticket(
            key="AICB-107",
            issue_type="Story",
            summary="Add grounded root cause analysis response template",
            description=(
                "Root cause responses should separate ticket facts, inferred causes, missing evidence, and suggested "
                "validation steps. The model must not present guesses as facts."
            ),
            status="In Progress",
            priority="Medium",
            assignee="Owen Wright",
            reporter="Elena Brooks",
            labels=["prompting", "root-cause", "grounding"],
            components=["prompting", "answer-generation"],
            sprint="Sprint 24",
            created_at="2026-05-30T09:00:00Z",
            updated_at="2026-06-12T13:35:00Z",
            due_date="2026-06-22",
            resolution=None,
            story_points=5,
            environment="development",
            acceptance_criteria=[
                "Template has separate sections for facts, inference, missing information, and confidence.",
                "All factual claims cite ticket keys.",
                "Snapshot tests verify wording for incomplete tickets.",
            ],
            comments=[
                comment("Owen Wright", "Draft template is ready; waiting for review from compliance.", "2026-06-12T13:35:00Z"),
            ],
            linked_issues=[{"key": "AICB-101", "type": "relates to"}],
            custom_fields={"severity": "S3", "customer_impact": "Low - improves answer quality"},
        ),
        ticket(
            key="AICB-108",
            issue_type="Bug",
            summary="Repeated LLM provider 429 errors during daily ticket report",
            description=(
                "The 9 AM daily report retries immediately after rate limit responses. This caused three failed "
                "report runs in the last week."
            ),
            status="Reopened",
            priority="High",
            assignee="Iris Khan",
            reporter="Ravi Kumar",
            labels=["rate-limit", "llm", "repeated-failure"],
            components=["llm-client", "reports"],
            sprint="Sprint 24",
            created_at="2026-05-18T06:55:00Z",
            updated_at="2026-06-15T06:35:00Z",
            due_date="2026-06-20",
            resolution=None,
            story_points=3,
            environment="production",
            acceptance_criteria=[
                "LLM retries use exponential backoff with jitter.",
                "Daily report degrades gracefully when rate limits persist.",
                "Failure count metric is emitted for alerting.",
            ],
            comments=[
                comment("Iris Khan", "Backoff was added but report failed again after a burst of 18 requests.", "2026-06-14T06:20:00Z"),
                comment("Ravi Kumar", "Reopening because the same symptom occurred for the third time.", "2026-06-15T06:35:00Z"),
            ],
            custom_fields={
                "severity": "S2",
                "customer_impact": "Medium - leadership report was missing",
                "repeated_failure_count": 3,
            },
        ),
        ticket(
            key="AICB-109",
            issue_type="Task",
            summary="Remove unused notebooks and temporary evaluation artifacts",
            description=(
                "Repository contains old notebooks, scratch JSON dumps, and one local vector store snapshot. "
                "Remove files that are not required for app runtime or tests."
            ),
            status="To Do",
            priority="Low",
            assignee="Jordan Lee",
            reporter="Maya Chen",
            labels=["cleanup", "repo-hygiene"],
            components=["repository"],
            sprint="Backlog",
            created_at="2026-06-02T11:00:00Z",
            updated_at="2026-06-02T11:00:00Z",
            due_date=None,
            resolution=None,
            story_points=2,
            environment="development",
            acceptance_criteria=[
                "Delete only files confirmed unused.",
                "Document removed paths in the cleanup summary.",
                "Tests pass after cleanup.",
            ],
            comments=[
                comment("Maya Chen", "Please avoid deleting sample fixtures used by retrieval tests.", "2026-06-02T11:05:00Z"),
            ],
            custom_fields={"severity": "S4", "customer_impact": "Low - developer experience only"},
        ),
        ticket(
            key="AICB-110",
            issue_type="Bug",
            summary="Suggested solution response invents implementation estimates",
            description=(
                "When asked for a solution for AICB-101, the assistant proposed '2 days of backend work' even "
                "though the ticket has no estimate field or implementation plan."
            ),
            status="In Progress",
            priority="Highest",
            assignee="Owen Wright",
            reporter="Ava Patel",
            labels=["hallucination-risk", "solution-generation", "prompting"],
            components=["answer-generation", "prompting"],
            sprint="Sprint 24",
            created_at="2026-06-04T16:25:00Z",
            updated_at="2026-06-14T19:20:00Z",
            due_date="2026-06-18",
            resolution=None,
            story_points=5,
            environment="production",
            acceptance_criteria=[
                "Suggested solutions are labeled as recommendations.",
                "Missing estimate or owner information is reported as missing information.",
                "The answer does not invent dates, effort, or assignee details.",
            ],
            comments=[
                comment("Ava Patel", "This is a compliance blocker because estimates looked authoritative.", "2026-06-10T08:10:00Z"),
                comment("Owen Wright", "Adding a stricter solution prompt and confidence section.", "2026-06-14T19:20:00Z"),
            ],
            linked_issues=[{"key": "AICB-101", "type": "relates to"}],
            custom_fields={
                "severity": "S1",
                "customer_impact": "High - users may act on invented effort estimates",
                "root_cause_hypothesis": "Prompt did not forbid unsupported implementation details.",
            },
        ),
        ticket(
            key="AICB-111",
            issue_type="Story",
            summary="Create risk dashboard for unresolved Jira tickets",
            description=(
                "Product owners need a dashboard that highlights blocked tickets, high priority unresolved tickets, "
                "long inactivity, and tickets missing owner or acceptance criteria."
            ),
            status="Ready",
            priority="Medium",
            assignee="Noah Singh",
            reporter="Priya Nair",
            labels=["analytics", "risk-reporting"],
            components=["reports", "analytics"],
            sprint="Sprint 25",
            created_at="2026-06-07T10:00:00Z",
            updated_at="2026-06-11T10:30:00Z",
            due_date="2026-06-28",
            resolution=None,
            story_points=8,
            environment="development",
            acceptance_criteria=[
                "Dashboard lists blocked tickets with blocker reason when present.",
                "Dashboard lists high priority unresolved tickets.",
                "Dashboard identifies tickets inactive for more than 14 days.",
                "Dashboard identifies missing assignee and missing acceptance criteria.",
            ],
            comments=[
                comment("Priya Nair", "Use this dummy dataset as an initial analytics fixture.", "2026-06-11T10:30:00Z"),
            ],
            custom_fields={"severity": "S3", "customer_impact": "Low - internal planning"},
        ),
        ticket(
            key="AICB-112",
            issue_type="Bug",
            summary="Jira sync drops comments after the first 100 comments",
            description=(
                "Large tickets with more than 100 comments only ingest the first page of comments. Analysis for "
                "long-running incidents misses the latest customer updates."
            ),
            status="Open",
            priority="Critical",
            assignee=None,
            reporter="Elena Brooks",
            labels=["jira-sync", "comments", "data-loss"],
            components=["jira-client", "ingestion"],
            sprint="Sprint 24",
            created_at="2026-05-27T13:15:00Z",
            updated_at="2026-06-15T05:50:00Z",
            due_date="2026-06-19",
            resolution=None,
            story_points=8,
            environment="production",
            acceptance_criteria=[
                "Comment pagination fetches all comments for each ticket.",
                "Latest comment timestamp is stored in processed ticket metadata.",
                "Sync logs warn when Jira returns partial comment data.",
            ],
            comments=[
                comment("Elena Brooks", "A customer escalation note was missing from the generated answer.", "2026-06-13T20:15:00Z"),
                comment("Ravi Kumar", "No assignee yet. This should be triaged today.", "2026-06-15T05:50:00Z"),
            ],
            custom_fields={
                "severity": "S1",
                "customer_impact": "High - latest incident details can be omitted",
                "repeated_failure_count": 2,
                "blocked_reason": "Needs backend owner assignment",
            },
        ),
        ticket(
            key="AICB-113",
            issue_type="Task",
            summary="Define ServiceNow to Jira field mapping for imported tickets",
            description=(
                "Imported ServiceNow incidents do not have a finalized mapping for urgency, impact, assignment "
                "group, and caller. Requirements are currently unclear."
            ),
            status="Blocked",
            priority="High",
            assignee="Lina Gomez",
            reporter="Sam Rivera",
            labels=["servicenow", "requirements", "blocked"],
            components=["ingestion", "servicenow-import"],
            sprint="Sprint 25",
            created_at="2026-06-08T09:20:00Z",
            updated_at="2026-06-12T09:00:00Z",
            due_date="2026-06-24",
            resolution=None,
            story_points=3,
            environment="development",
            acceptance_criteria=[],
            comments=[
                comment("Lina Gomez", "Blocked until product confirms whether impact maps to priority or severity.", "2026-06-12T09:00:00Z"),
            ],
            custom_fields={
                "severity": "S2",
                "customer_impact": "Medium - imported ticket analysis may rank incidents incorrectly",
                "blocked_reason": "Product decision needed on field mapping",
                "external_dependency": "Product owner",
            },
        ),
        ticket(
            key="AICB-114",
            issue_type="Bug",
            summary="HTML tags from Jira descriptions appear in chatbot answers",
            description=(
                "Descriptions containing Jira rich text are converted to strings with raw HTML tags. The chatbot "
                "sometimes repeats the tags in final answers."
            ),
            status="Done",
            priority="Medium",
            assignee="Iris Khan",
            reporter="Ava Patel",
            labels=["preprocessing", "formatting"],
            components=["preprocessing", "answer-generation"],
            sprint="Sprint 23",
            created_at="2026-05-12T15:00:00Z",
            updated_at="2026-05-31T12:25:00Z",
            due_date="2026-05-31",
            resolution="Done",
            story_points=2,
            environment="production",
            acceptance_criteria=[
                "HTML tags are stripped or converted to plain text during preprocessing.",
                "Bullet lists remain readable in the final answer.",
                "Regression test covers Jira rich text fields.",
            ],
            comments=[
                comment("Iris Khan", "Resolved by normalizing Jira rich text before chunking.", "2026-05-31T12:25:00Z"),
            ],
            custom_fields={"severity": "S3", "customer_impact": "Low - answer readability issue"},
        ),
        ticket(
            key="AICB-115",
            issue_type="Story",
            summary="Add similar ticket search for duplicate incident analysis",
            description=(
                "Support engineers need to find tickets similar to a current incident by summary, description, "
                "labels, components, and recent comments."
            ),
            status="In Progress",
            priority="High",
            assignee="Sam Rivera",
            reporter="Elena Brooks",
            labels=["similarity", "retrieval", "deduplication"],
            components=["retrieval", "analytics"],
            sprint="Sprint 24",
            created_at="2026-06-05T10:40:00Z",
            updated_at="2026-06-14T14:10:00Z",
            due_date="2026-06-23",
            resolution=None,
            story_points=5,
            environment="development",
            acceptance_criteria=[
                "Given a ticket key, return the top five similar unresolved tickets.",
                "Results include similarity reason and cited matching fields.",
                "Duplicate chunks from the same ticket are grouped together.",
            ],
            comments=[
                comment("Sam Rivera", "Reranker improves similar results, but duplicate chunks still need grouping.", "2026-06-14T14:10:00Z"),
            ],
            linked_issues=[{"key": "AICB-105", "type": "relates to"}],
            custom_fields={"severity": "S2", "customer_impact": "Medium - support spends time searching manually"},
        ),
        ticket(
            key="AICB-116",
            issue_type="Bug",
            summary="Ticket summary cache is never refreshed after manual resync",
            description=(
                "Manual resync refreshes raw Jira data but does not clear cached generated summaries. Users can "
                "see old status and old blocker text in summarized responses."
            ),
            status="To Do",
            priority="Medium",
            assignee="Maya Chen",
            reporter="Jordan Lee",
            labels=["summary-cache", "stale-data", "inactivity"],
            components=["cache", "summarization"],
            sprint="Backlog",
            created_at="2026-03-21T09:00:00Z",
            updated_at="2026-03-28T09:10:00Z",
            due_date=None,
            resolution=None,
            story_points=3,
            environment="staging",
            acceptance_criteria=[],
            comments=[
                comment("Jordan Lee", "No update since March. Need to confirm whether this still reproduces.", "2026-03-28T09:10:00Z"),
            ],
            custom_fields={
                "severity": "S3",
                "customer_impact": "Low - stale summaries in staging",
                "days_inactive_hint": 79,
            },
        ),
        ticket(
            key="AICB-117",
            issue_type="Task",
            summary="Imported tickets missing acceptance criteria should be flagged",
            description=(
                "Several imported stories have empty acceptance criteria. The analysis layer should flag these as "
                "unclear requirements instead of treating them as ready for implementation."
            ),
            status="Open",
            priority="High",
            assignee=None,
            reporter="Priya Nair",
            labels=["requirements", "analytics", "missing-data"],
            components=["analytics", "preprocessing"],
            sprint="Sprint 25",
            created_at="2026-06-09T12:00:00Z",
            updated_at="2026-06-13T12:30:00Z",
            due_date="2026-06-26",
            resolution=None,
            story_points=2,
            environment="development",
            acceptance_criteria=[],
            comments=[
                comment("Priya Nair", "This should appear in the risk dashboard as missing acceptance criteria and missing owner.", "2026-06-13T12:30:00Z"),
            ],
            linked_issues=[{"key": "AICB-111", "type": "relates to"}],
            custom_fields={"severity": "S2", "customer_impact": "Medium - unclear requirements can enter sprint planning"},
        ),
        ticket(
            key="AICB-118",
            issue_type="Bug",
            summary="Prompt sends full ticket JSON and exceeds token budget",
            description=(
                "For broad questions, the answer pipeline sends raw ticket JSON for every retrieved chunk. Long "
                "comments and unused fields push requests above the configured token limit."
            ),
            status="In Review",
            priority="Critical",
            assignee="Ravi Kumar",
            reporter="Maya Chen",
            labels=["token-usage", "prompting", "rag"],
            components=["prompting", "retrieval"],
            sprint="Sprint 24",
            created_at="2026-06-06T08:45:00Z",
            updated_at="2026-06-15T04:15:00Z",
            due_date="2026-06-18",
            resolution=None,
            story_points=5,
            environment="production",
            acceptance_criteria=[
                "Prompt context uses compact field blocks instead of raw JSON.",
                "Long comments are summarized before prompt construction.",
                "Context builder enforces a maximum token budget.",
            ],
            comments=[
                comment("Ravi Kumar", "Compact context reduced one sample prompt from 11k tokens to 3.4k tokens.", "2026-06-14T18:00:00Z"),
                comment("Maya Chen", "Need final review for comment summarization behavior.", "2026-06-15T04:15:00Z"),
            ],
            linked_issues=[{"key": "AICB-101", "type": "relates to"}],
            custom_fields={
                "severity": "S1",
                "customer_impact": "High - users see slow or failed answers",
                "token_budget": 4500,
            },
        ),
        ticket(
            key="AICB-119",
            issue_type="Story",
            summary="Cache repeated answers for identical safe Jira questions",
            description=(
                "Repeated questions such as 'which high priority tickets are blocked' should reuse a cached answer "
                "when the underlying ticket dataset has not changed."
            ),
            status="To Do",
            priority="Medium",
            assignee="Iris Khan",
            reporter="Ravi Kumar",
            labels=["cache", "answers", "performance"],
            components=["cache", "answer-generation"],
            sprint="Sprint 25",
            created_at="2026-06-10T09:15:00Z",
            updated_at="2026-06-10T09:15:00Z",
            due_date="2026-06-30",
            resolution=None,
            story_points=3,
            environment="development",
            acceptance_criteria=[
                "Answer cache key includes normalized question and dataset version.",
                "Cache is bypassed for questions requiring current time-sensitive data.",
                "Logs include answer cache hit or miss without ticket content.",
            ],
            comments=[
                comment("Ravi Kumar", "Use this only when retrieval results are stable and ticket updated_at values are unchanged.", "2026-06-10T09:15:00Z"),
            ],
            custom_fields={"severity": "S3", "customer_impact": "Low - performance improvement"},
        ),
        ticket(
            key="AICB-120",
            issue_type="Incident",
            summary="VIP customer cannot query blocker status from chatbot",
            description=(
                "A VIP customer asked which tickets block the June launch, but the chatbot returned a generic "
                "answer without listing the blocked tickets. Account team escalated the issue."
            ),
            status="Escalated",
            priority="Critical",
            assignee="Noah Singh",
            reporter="Ava Patel",
            labels=["escalation", "blocked", "customer-impact", "rag"],
            components=["retrieval", "answer-generation", "reports"],
            sprint="Sprint 24",
            created_at="2026-06-13T21:00:00Z",
            updated_at="2026-06-15T07:30:00Z",
            due_date="2026-06-16",
            resolution=None,
            story_points=None,
            environment="production",
            acceptance_criteria=[
                "Query for blockers returns blocked ticket keys and blocker reasons when available.",
                "Escalated answers include missing information instead of guessing launch impact.",
                "Customer-facing response cites all referenced ticket IDs.",
            ],
            comments=[
                comment("Ava Patel", "Customer asked for launch blockers and got an answer with no ticket IDs.", "2026-06-13T21:05:00Z"),
                comment("Noah Singh", "Likely retrieval issue: blocked label was not included in chunk metadata.", "2026-06-14T08:30:00Z"),
                comment("Ravi Kumar", "AICB-104 and AICB-113 should have been retrieved for that question.", "2026-06-14T12:10:00Z"),
                comment("Elena Brooks", "Please send a corrected summary before the June launch readiness call.", "2026-06-15T07:00:00Z"),
                comment("Noah Singh", "Escalation is active until blocker query is fixed and verified.", "2026-06-15T07:30:00Z"),
            ],
            linked_issues=[{"key": "AICB-104", "type": "relates to"}, {"key": "AICB-113", "type": "relates to"}],
            custom_fields={
                "severity": "S1",
                "customer_impact": "High - VIP customer escalation",
                "escalation_owner": "Ava Patel",
                "blocked_reason": "Blocked ticket retrieval misses status and label metadata",
            },
        ),
    ]


def flatten_for_csv(ticket_data: dict[str, Any]) -> dict[str, Any]:
    custom_fields = ticket_data["custom_fields"]
    return {
        "key": ticket_data["key"],
        "issue_type": ticket_data["issue_type"],
        "summary": ticket_data["summary"],
        "status": ticket_data["status"],
        "priority": ticket_data["priority"],
        "assignee": ticket_data["assignee"] or "",
        "reporter": ticket_data["reporter"],
        "labels": ",".join(ticket_data["labels"]),
        "components": ",".join(ticket_data["components"]),
        "sprint": ticket_data["sprint"] or "",
        "created_at": ticket_data["created_at"],
        "updated_at": ticket_data["updated_at"],
        "due_date": ticket_data["due_date"] or "",
        "resolution": ticket_data["resolution"] or "",
        "story_points": ticket_data["story_points"] if ticket_data["story_points"] is not None else "",
        "environment": ticket_data["environment"],
        "acceptance_criteria_count": len(ticket_data["acceptance_criteria"]),
        "comments_count": len(ticket_data["comments"]),
        "linked_issue_keys": ",".join(issue["key"] for issue in ticket_data["linked_issues"]),
        "severity": custom_fields.get("severity", ""),
        "customer_impact": custom_fields.get("customer_impact", ""),
        "blocked_reason": custom_fields.get("blocked_reason", ""),
        "repeated_failure_count": custom_fields.get("repeated_failure_count", ""),
    }


def write_json(tickets: list[dict[str, Any]], path: Path) -> None:
    path.write_text(json.dumps(tickets, indent=2) + "\n", encoding="utf-8")


def write_csv(tickets: list[dict[str, Any]], path: Path) -> None:
    rows = [flatten_for_csv(ticket_data) for ticket_data in tickets]
    with path.open("w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def parse_args() -> argparse.Namespace:
    default_out_dir = Path(__file__).resolve().parents[1] / "data"
    parser = argparse.ArgumentParser(description="Generate deterministic dummy Jira ticket fixtures.")
    parser.add_argument("--out-dir", type=Path, default=default_out_dir, help="Directory for generated files.")
    parser.add_argument("--json-name", default="dummy_jira_tickets.json", help="Generated JSON filename.")
    parser.add_argument("--csv-name", default="dummy_jira_tickets.csv", help="Generated CSV filename.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    tickets = make_tickets()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    json_path = args.out_dir / args.json_name
    csv_path = args.out_dir / args.csv_name
    write_json(tickets, json_path)
    write_csv(tickets, csv_path)

    print(f"Generated {len(tickets)} tickets")
    print(f"JSON: {json_path}")
    print(f"CSV: {csv_path}")


if __name__ == "__main__":
    main()
