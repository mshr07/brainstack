# Contributing

Use a short-lived branch prefixed with `codex/` or your team convention. Keep
changes vertically testable and separate contract changes from unrelated
refactors.

1. Read the closest `AGENTS.md` and relevant ADRs.
2. Add or update the contract before cross-service behavior changes.
3. Implement the smallest production-shaped slice, including failure behavior.
4. Run `make format`, `make lint`, `make test`, and `make contract-check`.
5. Update operational and security documentation when behavior changes.
6. In the pull request, report measured results, migrations, rollback approach,
   security impact, and known limitations.

Never commit `.env`, credentials, generated data, Terraform state, dependency
directories, or unreviewed metadata promoted as trusted.
