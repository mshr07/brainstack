from __future__ import annotations

import pyarrow as pa
import pytest

from adsage_pipelines.schemas import SchemaEvolutionError, event_schema, validate_arrow_schema


def test_nullable_addition_is_backward_compatible() -> None:
    current = event_schema("impression_events", 2)
    evolved = current.append(pa.field("inventory_source", pa.string(), nullable=True))

    validate_arrow_schema("impression_events", 2, evolved)


def test_removal_type_change_and_required_addition_need_review() -> None:
    current = event_schema("impression_events", 2)
    removed = pa.schema([field for field in current if field.name != "event_id"])
    changed = pa.schema(
        [
            pa.field("event_id", pa.int64(), nullable=False) if field.name == "event_id" else field
            for field in current
        ]
    )
    required_addition = current.append(pa.field("inventory_source", pa.string(), nullable=False))

    with pytest.raises(SchemaEvolutionError, match="removed required"):
        validate_arrow_schema("impression_events", 2, removed)
    with pytest.raises(SchemaEvolutionError, match="changed type"):
        validate_arrow_schema("impression_events", 2, changed)
    with pytest.raises(SchemaEvolutionError, match="non-nullable"):
        validate_arrow_schema("impression_events", 2, required_addition)
