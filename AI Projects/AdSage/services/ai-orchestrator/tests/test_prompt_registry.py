from pathlib import Path

import yaml


def test_prompt_manifest_is_versioned_and_inactive_until_provider_phase() -> None:
    prompt_path = Path(__file__).parents[1] / "prompts" / "intent" / "classifier" / "v1.yaml"
    manifest = yaml.safe_load(prompt_path.read_text(encoding="utf-8"))

    assert manifest["name"] == "intent.classifier"
    assert manifest["version"] == 1
    assert manifest["status"] == "inactive"
    assert manifest["input_schema"]
    assert manifest["output_schema"]
