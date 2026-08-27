from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq

from adsage_pipelines.duckdb_checks import validate_gold_dataset


def test_duckdb_rejects_ratio_not_recomputed_from_additive_measures(tmp_path: Path) -> None:
    dataset = tmp_path / "campaign_daily_metrics"
    dataset.mkdir()
    row = {
        "tenant_id": "11111111-1111-4111-8111-111111111111",
        "metric_date": date(2026, 8, 1),
        "advertiser_id": "advertiser",
        "campaign_id": "campaign",
        "country_code": "US",
        "device_type": "MOBILE",
        "placement_id": "placement",
        "currency": "USD",
        "attribution_version": "last_click_v1",
        "impressions": 10,
        "clicks": 2,
        "advertising_spend": Decimal("4.000000"),
        "attributed_conversions": Decimal("1.000000"),
        "attributed_sales": Decimal("8.000000"),
        "data_through": datetime(2026, 8, 2),
        "late_event_rows": 0,
        "ctr": Decimal("0.90000000"),
        "cpc": Decimal("2.00000000"),
        "cpm": Decimal("400.00000000"),
        "cvr": Decimal("0.50000000"),
        "roas": Decimal("2.00000000"),
        "acos": Decimal("0.50000000"),
        "cpa": Decimal("4.00000000"),
    }
    pq.write_table(pa.Table.from_pylist([row]), dataset / "bad-ratio.parquet")

    result = validate_gold_dataset(dataset)

    assert result.passed is False
    assert result.failures["CTR_FORMULA_MISMATCH"] == 1
    assert sum(result.failures.values()) == 1
