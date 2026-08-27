from __future__ import annotations

from pathlib import Path

from adsage_pipelines.glossary import load_glossary

GLOSSARY = Path(__file__).parents[1] / "resources" / "glossary" / "metrics.v1.yaml"


def test_canonical_ratio_formulas_are_versioned_metadata() -> None:
    glossary = load_glossary(GLOSSARY)
    formulas = {metric.metric_id: metric.formula for metric in glossary.metrics}

    assert len(glossary.metrics) == 12
    assert formulas["ctr"] == "SUM(clicks) / NULLIF(SUM(impressions), 0)"
    assert formulas["cvr"] == "SUM(attributed_conversions) / NULLIF(SUM(clicks), 0)"
    assert formulas["roas"] == ("SUM(attributed_sales) / NULLIF(SUM(advertising_spend), 0)")
