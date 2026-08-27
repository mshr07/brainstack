"""Independent DuckDB assertions over published Gold Parquet."""

from __future__ import annotations

from pathlib import Path

import duckdb
from pydantic import BaseModel, ConfigDict

from adsage_pipelines.manifest import read_pointer, resolve_pointer_version


class DuckDBValidation(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    dataset_path: Path
    row_count: int
    failures: dict[str, int]

    @property
    def passed(self) -> bool:
        return not any(self.failures.values())


def _scalar(connection: duckdb.DuckDBPyConnection, query: str) -> int:
    value = connection.execute(query).fetchone()
    return int(value[0]) if value is not None else 0


def validate_gold_dataset(dataset_path: Path) -> DuckDBValidation:
    """Recompute ratios and grain invariants using an engine independent of Spark."""

    parquet_files = sorted(dataset_path.rglob("*.parquet"))
    if not parquet_files:
        raise FileNotFoundError(f"no Gold Parquet files under {dataset_path}")
    connection = duckdb.connect(":memory:")
    try:
        connection.read_parquet(
            [str(path.resolve()) for path in parquet_files], hive_partitioning=True
        ).create_view("metrics")
        failures = {
            "DUPLICATE_GRAIN": _scalar(
                connection,
                """
                SELECT COUNT(*) FROM (
                  SELECT tenant_id, metric_date, advertiser_id, campaign_id, country_code,
                         device_type, placement_id, currency, attribution_version,
                         COUNT(*) AS row_count
                  FROM metrics
                  GROUP BY ALL
                  HAVING COUNT(*) > 1
                )
                """,
            ),
            "NEGATIVE_ADDITIVE_MEASURE": _scalar(
                connection,
                """
                SELECT COUNT(*) FROM metrics
                WHERE impressions < 0 OR clicks < 0 OR advertising_spend < 0
                   OR attributed_conversions < 0 OR attributed_sales < 0
                """,
            ),
            "NULL_ADDITIVE_MEASURE": _scalar(
                connection,
                """
                SELECT COUNT(*) FROM metrics
                WHERE impressions IS NULL OR clicks IS NULL OR advertising_spend IS NULL
                   OR attributed_conversions IS NULL OR attributed_sales IS NULL
                """,
            ),
            "CTR_FORMULA_MISMATCH": _scalar(
                connection,
                """
                SELECT COUNT(*) FROM metrics
                WHERE CASE WHEN impressions = 0 THEN ctr IS NOT NULL
                           ELSE ctr IS NULL OR abs(ctr - clicks / impressions) > 0.00000001 END
                """,
            ),
            "CPC_FORMULA_MISMATCH": _scalar(
                connection,
                """
                SELECT COUNT(*) FROM metrics
                WHERE CASE WHEN clicks = 0 THEN cpc IS NOT NULL
                           ELSE cpc IS NULL OR
                                abs(cpc - advertising_spend / clicks) > 0.00000001 END
                """,
            ),
            "CPM_FORMULA_MISMATCH": _scalar(
                connection,
                """
                SELECT COUNT(*) FROM metrics
                WHERE CASE WHEN impressions = 0 THEN cpm IS NOT NULL
                           ELSE cpm IS NULL OR
                                abs(cpm - 1000 * advertising_spend / impressions) > 0.00000001 END
                """,
            ),
            "CVR_FORMULA_MISMATCH": _scalar(
                connection,
                """
                SELECT COUNT(*) FROM metrics
                WHERE CASE WHEN clicks = 0 THEN cvr IS NOT NULL
                           ELSE cvr IS NULL OR
                                abs(cvr - attributed_conversions / clicks) > 0.00000001 END
                """,
            ),
            "ROAS_FORMULA_MISMATCH": _scalar(
                connection,
                """
                SELECT COUNT(*) FROM metrics
                WHERE CASE WHEN advertising_spend = 0 THEN roas IS NOT NULL
                           ELSE roas IS NULL OR
                                abs(roas - attributed_sales / advertising_spend) > 0.00000001 END
                """,
            ),
            "ACOS_FORMULA_MISMATCH": _scalar(
                connection,
                """
                SELECT COUNT(*) FROM metrics
                WHERE CASE WHEN attributed_sales = 0 THEN acos IS NOT NULL
                           ELSE acos IS NULL OR
                                abs(acos - advertising_spend / attributed_sales) > 0.00000001 END
                """,
            ),
            "CPA_FORMULA_MISMATCH": _scalar(
                connection,
                """
                SELECT COUNT(*) FROM metrics
                WHERE CASE WHEN attributed_conversions = 0 THEN cpa IS NOT NULL
                           ELSE cpa IS NULL OR
                                abs(cpa - advertising_spend / attributed_conversions)
                                  > 0.00000001 END
                """,
            ),
        }
        return DuckDBValidation(
            dataset_path=dataset_path,
            row_count=_scalar(connection, "SELECT COUNT(*) FROM metrics"),
            failures=failures,
        )
    finally:
        connection.close()


def validate_current_gold(lake_root: Path) -> DuckDBValidation:
    lake_root = lake_root.resolve()
    gold_root = lake_root / "gold"
    pointer = read_pointer(gold_root)
    dataset = resolve_pointer_version(gold_root, pointer) / "campaign_daily_metrics"
    return validate_gold_dataset(dataset)
