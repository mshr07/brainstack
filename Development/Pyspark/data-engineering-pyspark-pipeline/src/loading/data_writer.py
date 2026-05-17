from pathlib import Path
from typing import Iterable, Optional

from pyspark.sql import DataFrame

from src.config.settings import OUTPUT_FORMAT, SMALL_FILE_COALESCE_PARTITIONS


def write_table(
    df: DataFrame,
    path: Path,
    mode: str = "overwrite",
    fmt: str = OUTPUT_FORMAT,
    partition_cols: Optional[Iterable[str]] = None,
    coalesce_files: bool = False,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    output_df = df.coalesce(SMALL_FILE_COALESCE_PARTITIONS) if coalesce_files else df
    writer = output_df.write.mode(mode).format(fmt)
    if partition_cols:
        writer = writer.partitionBy(*partition_cols)
    writer.save(str(path))


def read_table(spark, path: Path, fmt: str = OUTPUT_FORMAT) -> DataFrame:
    return spark.read.format(fmt).load(str(path))
