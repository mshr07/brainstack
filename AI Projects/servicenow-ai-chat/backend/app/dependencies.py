from __future__ import annotations

from functools import lru_cache

from app.config import Settings, get_settings
from app.services.analytics_service import AnalyticsService
from app.services.cache_service import CacheService
from app.services.chat_service import ChatService
from app.services.context_builder import ContextBuilder
from app.services.embedding_service import EmbeddingService
from app.services.guardrails import Guardrails
from app.services.jira_client import JiraClient
from app.services.llm_service import LLMService
from app.services.prompt_builder import PromptBuilder
from app.services.reranker import Reranker
from app.services.retriever import Retriever
from app.services.ticket_ingestion import TicketIngestionService
from app.services.ticket_preprocessor import TicketPreprocessor
from app.services.vector_store import VectorStore


class ServiceContainer:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.cache = CacheService(settings)
        self.preprocessor = TicketPreprocessor()
        self.jira_client = JiraClient(settings)
        self.ingestion = TicketIngestionService(self.jira_client, self.preprocessor)
        self.embedding = EmbeddingService(settings, self.cache)
        self.vector_store = VectorStore(self.embedding, self.preprocessor)
        self.retriever = Retriever(settings, self.cache, self.vector_store, self.embedding)
        self.reranker = Reranker()
        self.context_builder = ContextBuilder(settings)
        self.prompt_builder = PromptBuilder()
        self.guardrails = Guardrails()
        self.llm = LLMService(self.guardrails)
        self.chat = ChatService(
            settings,
            self.cache,
            self.retriever,
            self.reranker,
            self.context_builder,
            self.prompt_builder,
            self.llm,
            self.guardrails,
        )
        self.analytics = AnalyticsService()


@lru_cache(maxsize=1)
def get_container() -> ServiceContainer:
    return ServiceContainer(get_settings())
