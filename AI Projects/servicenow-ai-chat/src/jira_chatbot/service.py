from __future__ import annotations

import logging

from jira_chatbot.analysis import JiraAnalyzer
from jira_chatbot.answering import GroundedAnswerGenerator
from jira_chatbot.cache import CacheBackend, FileCache, InMemoryCache
from jira_chatbot.config import Settings
from jira_chatbot.jira_client import FileJiraClient, HttpJiraClient, JiraClient
from jira_chatbot.models import GroundedAnswer, Ticket
from jira_chatbot.preprocessing import process_tickets
from jira_chatbot.prompts import PromptBuilder, infer_prompt_kind
from jira_chatbot.retrieval import TicketIndex
from jira_chatbot.utils import stable_hash

logger = logging.getLogger(__name__)


class JiraChatbotService:
    def __init__(
        self,
        settings: Settings | None = None,
        jira_client: JiraClient | None = None,
        cache: CacheBackend | None = None,
    ) -> None:
        self.settings = settings or Settings.from_env()
        self.cache = cache or FileCache(self.settings.cache_dir, enabled=self.settings.cache_enabled)
        self.jira_client = jira_client or self._default_client()
        self.prompt_builder = PromptBuilder(max_context_chars=self.settings.retrieval_max_context_chars)
        self.answer_generator = GroundedAnswerGenerator()
        self.tickets: list[Ticket] = []
        self.index: TicketIndex | None = None
        self.sync()

    @classmethod
    def in_memory(cls, settings: Settings | None = None) -> "JiraChatbotService":
        return cls(settings=settings, cache=InMemoryCache(enabled=True))

    def sync(self) -> None:
        logger.info("jira sync started")
        raw = self.jira_client.fetch_tickets()
        self.tickets = process_tickets(raw, cache=self.cache)
        self.index = TicketIndex(
            self.tickets,
            project_key=self.settings.jira_project_key,
            cache=self.cache,
            reranking_enabled=self.settings.retrieval_reranking_enabled,
        )
        logger.info("jira sync completed tickets=%s", len(self.tickets))

    def ask(self, query: str) -> GroundedAnswer:
        if not query or not query.strip():
            return GroundedAnswer(
                answer="Answer:\nPlease provide a Jira question.\n\nRelevant tickets:\nNone\n\nConfidence: Low",
                ticket_ids=(),
                confidence="Low",
            )
        if self.index is None:
            self.sync()
        assert self.index is not None

        analysis_answer = self._try_analysis_answer(query)
        if analysis_answer:
            return analysis_answer

        direct_keys = self.index.extract_ticket_keys(query)
        kind = infer_prompt_kind(query, has_ticket_key=bool(direct_keys))
        answer_cache_key = stable_hash({"query": query.lower().strip(), "version": self.index.version, "kind": kind.value})
        if self.settings.answer_cache_enabled:
            cached = self.cache.get("answer", answer_cache_key)
            if cached:
                return GroundedAnswer(
                    answer=cached["answer"],
                    ticket_ids=tuple(cached["ticket_ids"]),
                    confidence=cached["confidence"],
                    from_cache=True,
                )

        results = self.index.search(query, top_k=self._dynamic_top_k(query, direct_keys))
        tickets = self._tickets_from_results(results)
        if direct_keys:
            found = [self.index.get_ticket(key) for key in direct_keys]
            tickets = [ticket for ticket in found if ticket is not None]
            missing = [key for key, ticket in zip(direct_keys, found) if ticket is None]
            if missing and not tickets:
                return GroundedAnswer(
                    answer=(
                        "Answer:\n"
                        f"The available ticket data does not contain ticket ID(s): {', '.join(missing)}.\n\n"
                        "Relevant tickets:\nNone\n\nMissing information:\nA matching Jira ticket in the indexed data.\n\nConfidence: High"
                    ),
                    ticket_ids=(),
                    confidence="High",
                )

        answer = self.answer_generator.answer(query, tickets, results, kind)
        if self.settings.answer_cache_enabled:
            self.cache.set(
                "answer",
                answer_cache_key,
                {"answer": answer.answer, "ticket_ids": list(answer.ticket_ids), "confidence": answer.confidence},
            )
        return answer

    def retrieve(self, query: str, top_k: int | None = None) -> list:
        if self.index is None:
            self.sync()
        assert self.index is not None
        return self.index.search(query, top_k=top_k or self.settings.retrieval_top_k)

    def get_ticket(self, ticket_key: str) -> Ticket | None:
        if self.index is None:
            self.sync()
        assert self.index is not None
        return self.index.get_ticket(ticket_key)

    def risk_report(self) -> dict:
        analyzer = JiraAnalyzer(self.tickets)
        return {name: [finding.__dict__ for finding in findings] for name, findings in analyzer.risk_report().items()}

    def build_prompt(self, query: str) -> str:
        if self.index is None:
            self.sync()
        assert self.index is not None
        results = self.index.search(query, top_k=self.settings.retrieval_top_k)
        tickets = self._tickets_from_results(results)
        kind = infer_prompt_kind(query, has_ticket_key=bool(self.index.extract_ticket_keys(query)))
        return self.prompt_builder.build(query, tickets, results, kind)

    def _default_client(self) -> JiraClient:
        if self.settings.jira_base_url and self.settings.jira_email and self.settings.jira_api_token:
            return HttpJiraClient(
                self.settings.jira_base_url,
                self.settings.jira_email,
                self.settings.jira_api_token,
                self.settings.jira_project_key,
            )
        return FileJiraClient(self.settings.jira_data_path)

    def _tickets_from_results(self, results: list) -> list[Ticket]:
        if self.index is None:
            return []
        tickets = []
        seen: set[str] = set()
        for result in results:
            key = result.chunk.ticket_key
            if key in seen:
                continue
            ticket = self.index.get_ticket(key)
            if ticket:
                tickets.append(ticket)
                seen.add(key)
        return tickets

    def _dynamic_top_k(self, query: str, direct_keys: list[str]) -> int:
        lower = query.lower()
        if direct_keys:
            return max(len(direct_keys), 1)
        if any(token in lower for token in ["which", "list", "report", "all", "blocked", "critical", "unresolved"]):
            return max(self.settings.retrieval_top_k, 8)
        return self.settings.retrieval_top_k

    def _try_analysis_answer(self, query: str) -> GroundedAnswer | None:
        lower = query.lower()
        analyzer = JiraAnalyzer(self.tickets)
        generator = self.answer_generator
        if "missing assignee" in lower or "unassigned" in lower:
            return generator.findings_answer("Tickets missing assignees", analyzer.missing_assignee())
        if "missing acceptance" in lower or "acceptance criteria" in lower:
            return generator.findings_answer("Tickets missing acceptance criteria", analyzer.missing_acceptance_criteria())
        if "blocked" in lower and ("which" in lower or "list" in lower or "why" in lower):
            return generator.findings_answer("Blocked or escalated tickets", analyzer.blocked_tickets())
        if ("critical" in lower or "high priority" in lower) and "unresolved" in lower:
            return generator.findings_answer("High priority unresolved tickets", analyzer.high_priority_unresolved())
        if "repeated" in lower or "failure" in lower:
            return generator.findings_answer("Tickets with repeated failure signals", analyzer.repeated_failures())
        if "inactive" in lower or "stale" in lower:
            return generator.findings_answer("Tickets with long inactivity", analyzer.long_inactivity())
        if "escalat" in lower:
            return generator.findings_answer("Tickets that may need escalation", analyzer.escalation_candidates())
        return None
