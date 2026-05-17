import os
import re
import subprocess
from typing import Optional

from pyspark.sql import SparkSession

from src.config.settings import APP_NAME, DEFAULT_SHUFFLE_PARTITIONS, MASTER


def _java_major_version(version_output: str) -> Optional[int]:
    match = re.search(r'version "([^"]+)"', version_output)
    if not match:
        return None
    raw_version = match.group(1)
    if raw_version.startswith("1."):
        return int(raw_version.split(".")[1])
    return int(raw_version.split(".")[0])


def _find_java_home(version: str) -> Optional[str]:
    java_home_tool = "/usr/libexec/java_home"
    if not os.path.exists(java_home_tool):
        return None
    result = subprocess.run([java_home_tool, "-v", version], capture_output=True, text=True, check=False)
    if result.returncode == 0:
        return result.stdout.strip()
    return None


def _java_home_major_version(java_home: str) -> Optional[int]:
    java_bin = os.path.join(java_home, "bin", "java")
    if not os.path.exists(java_bin):
        return None
    result = subprocess.run([java_bin, "-version"], capture_output=True, text=True, check=False)
    return _java_major_version(result.stderr + result.stdout)


def configure_compatible_java_home() -> None:
    result = subprocess.run(["java", "-version"], capture_output=True, text=True, check=False)
    current_major = _java_major_version(result.stderr + result.stdout)
    if current_major is None or current_major <= 17:
        return

    for candidate in ["17", "11", "1.8"]:
        java_home = _find_java_home(candidate)
        java_home_major = _java_home_major_version(java_home) if java_home else None
        if java_home and java_home_major and java_home_major <= 17:
            os.environ["JAVA_HOME"] = java_home
            return


def get_spark(app_name: str = APP_NAME) -> SparkSession:
    configure_compatible_java_home()
    spark = (
        SparkSession.builder.appName(app_name)
        .master(MASTER)
        .config("spark.sql.shuffle.partitions", str(DEFAULT_SHUFFLE_PARTITIONS))
        .config("spark.sql.adaptive.enabled", "true")
        .config("spark.sql.adaptive.skewJoin.enabled", "true")
        .config("spark.sql.parquet.compression.codec", "snappy")
        .config("spark.sql.session.timeZone", "UTC")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")
    return spark
