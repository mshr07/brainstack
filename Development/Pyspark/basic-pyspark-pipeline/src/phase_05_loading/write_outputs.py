from pathlib import Path

from pyspark.sql import DataFrame


def write_good_data(df: DataFrame, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.coalesce(1).write.mode("overwrite").option("header", True).csv(str(output_path))


def write_bad_data(df: DataFrame, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.coalesce(1).write.mode("overwrite").option("header", True).csv(str(output_path))
