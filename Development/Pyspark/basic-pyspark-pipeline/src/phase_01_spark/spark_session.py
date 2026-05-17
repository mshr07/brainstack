import os
import re
import subprocess
from typing import Optional

from pyspark.sql import SparkSession


def _java_major(version_text: str) -> Optional[int]:
    match = re.search(r'version "([^"]+)"', version_text)
    if not match:
        return None
    version = match.group(1)
    if version.startswith("1."):
        return int(version.split(".")[1])
    return int(version.split(".")[0])


def _find_compatible_java_home() -> Optional[str]:
    java_home_tool = "/usr/libexec/java_home"
    if not os.path.exists(java_home_tool):
        return None
    for candidate in ["17", "11", "1.8"]:
        result = subprocess.run([java_home_tool, "-v", candidate], capture_output=True, text=True, check=False)
        java_home = result.stdout.strip()
        java_bin = os.path.join(java_home, "bin", "java")
        if result.returncode == 0 and os.path.exists(java_bin):
            version = subprocess.run([java_bin, "-version"], capture_output=True, text=True, check=False)
            major = _java_major(version.stderr + version.stdout)
            if major and major <= 17:
                return java_home
    return None


def configure_java_for_local_spark() -> None:
    result = subprocess.run(["java", "-version"], capture_output=True, text=True, check=False)
    current_major = _java_major(result.stderr + result.stdout)
    if current_major and current_major > 17:
        java_home = _find_compatible_java_home()
        if java_home:
            os.environ["JAVA_HOME"] = java_home


def create_spark_session(app_name: str = "BasicPySparkPipeline") -> SparkSession:
    configure_java_for_local_spark()
    spark = (
        SparkSession.builder.appName(app_name)
        .master("local[*]")
        .config("spark.sql.shuffle.partitions", "4")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")
    return spark
