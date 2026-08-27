import json
from collections.abc import Hashable
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator
from openapi_spec_validator import validate_spec

ROOT = Path(__file__).parents[1]


class UniqueKeyLoader(yaml.SafeLoader):
    """Reject duplicate YAML keys so a contract cannot silently overwrite policy."""


def construct_unique_mapping(
    loader: UniqueKeyLoader, node: yaml.MappingNode, deep: bool = False
) -> dict[Hashable, Any]:
    mapping: dict[Hashable, Any] = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if not isinstance(key, Hashable):
            raise TypeError(
                f"Unhashable YAML key at line {key_node.start_mark.line + 1}"
            )
        if key in mapping:
            raise ValueError(
                f"Duplicate YAML key {key!r} at line {key_node.start_mark.line + 1}"
            )
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping


UniqueKeyLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, construct_unique_mapping
)


def load_unique_yaml(value: str) -> Any:
    loader = UniqueKeyLoader(value)
    try:
        return loader.get_single_data()
    finally:
        loader.dispose()


def main() -> None:
    openapi_files = sorted((ROOT / "contracts" / "openapi").glob("*.yaml"))
    schema_files = sorted((ROOT / "contracts" / "schemas").glob("*.json"))
    if not openapi_files or not schema_files:
        raise RuntimeError("Expected both OpenAPI and JSON Schema contracts")
    for path in openapi_files:
        document = load_unique_yaml(path.read_text(encoding="utf-8"))
        validate_spec(document)
        print(f"validated OpenAPI: {path.relative_to(ROOT)}")
    for path in schema_files:
        document = json.loads(path.read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(document)
        if path.name == "mcp-tools.schema.json":
            validator = Draft202012Validator(document)
            request = {
                "version": "1",
                "toolCallId": "e5d67b66-03e2-447c-bb19-65b80c1a11a8",
                "deadlineAt": "2026-08-27T10:00:00Z",
                "tool": "search_metadata",
                "query": "ROAS columns",
                "limit": 10,
            }
            validator.validate(request)
            if not list(
                validator.iter_errors({**request, "capabilityContext": {"admin": True}})
            ):
                raise RuntimeError(
                    "MCP schema accepted a client-supplied capability context"
                )
        print(f"validated JSON Schema: {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
