from __future__ import annotations

import argparse
import json
import sys

from jira_chatbot.config import Settings
from jira_chatbot.logging_config import configure_logging
from jira_chatbot.service import JiraChatbotService


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Grounded Jira ticket chatbot")
    parser.add_argument("--data", help="Path to Jira JSON data")
    parser.add_argument("--log-level", default=None, help="Logging level")
    subcommands = parser.add_subparsers(dest="command", required=True)

    ask = subcommands.add_parser("ask", help="Ask a grounded Jira question")
    ask.add_argument("question")

    retrieve = subcommands.add_parser("retrieve", help="Show retrieved tickets")
    retrieve.add_argument("query")
    retrieve.add_argument("--top-k", type=int, default=6)

    subcommands.add_parser("risk-report", help="Print structured risk report")
    subcommands.add_parser("sync", help="Load and index Jira tickets")
    return parser


def load_service(args: argparse.Namespace) -> JiraChatbotService:
    settings = Settings.from_env()
    if args.data:
        settings = Settings(
            jira_data_path=__import__("pathlib").Path(args.data),
            jira_base_url=settings.jira_base_url,
            jira_project_key=settings.jira_project_key,
            jira_email=settings.jira_email,
            jira_api_token=settings.jira_api_token,
            model_name=settings.model_name,
            embedding_model=settings.embedding_model,
            cache_dir=settings.cache_dir,
            cache_enabled=settings.cache_enabled,
            answer_cache_enabled=settings.answer_cache_enabled,
            retrieval_top_k=settings.retrieval_top_k,
            retrieval_max_context_chars=settings.retrieval_max_context_chars,
            retrieval_reranking_enabled=settings.retrieval_reranking_enabled,
            log_level=settings.log_level,
        )
    return JiraChatbotService(settings=settings)


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    settings = Settings.from_env()
    configure_logging(args.log_level or settings.log_level)
    service = load_service(args)

    if args.command == "ask":
        print(service.ask(args.question).answer)
    elif args.command == "retrieve":
        results = service.retrieve(args.query, top_k=args.top_k)
        for result in results:
            print(f"{result.chunk.ticket_key}\t{result.score:.3f}\t{','.join(result.reasons)}\t{result.chunk.section}")
    elif args.command == "risk-report":
        print(json.dumps(service.risk_report(), indent=2))
    elif args.command == "sync":
        print(f"Loaded {len(service.tickets)} tickets")
    else:
        parser.error(f"Unknown command: {args.command}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
