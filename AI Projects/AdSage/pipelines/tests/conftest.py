from __future__ import annotations

from collections.abc import Iterator

import pytest
from pyspark.sql import SparkSession

from adsage_pipelines.config import SparkConfig
from adsage_pipelines.spark import create_spark_session


@pytest.fixture(scope="session")
def spark(tmp_path_factory: pytest.TempPathFactory) -> Iterator[SparkSession]:
    root = tmp_path_factory.mktemp("spark-lake")
    session = create_spark_session(SparkConfig(master="local[2]", shuffle_partitions=2), root)
    yield session
    session.stop()
