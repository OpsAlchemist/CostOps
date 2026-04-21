"""CloudWatch logging configuration using watchtower."""

import os
import logging
import boto3
import watchtower

LOG_GROUP = os.getenv("CLOUDWATCH_LOG_GROUP", "CostOpsTest")
LOG_STREAM = os.getenv("CLOUDWATCH_LOG_STREAM", "app")
AWS_REGION = os.getenv("DB_REGION", "us-east-1")
ENABLE_CLOUDWATCH = os.getenv("ENABLE_CLOUDWATCH", "true").lower() == "true"


def setup_logging():
    """Configure root logger to send logs to CloudWatch and stdout."""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Always log to stdout
    stdout_handler = logging.StreamHandler()
    stdout_handler.setFormatter(logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    ))
    logger.addHandler(stdout_handler)

    # CloudWatch handler
    if ENABLE_CLOUDWATCH:
        try:
            cw_client = boto3.client(
                "logs",
                region_name=AWS_REGION,
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            )
            cw_handler = watchtower.CloudWatchLogHandler(
                log_group_name=LOG_GROUP,
                log_stream_name=LOG_STREAM,
                boto3_client=cw_client,
                create_log_group=False,
                create_log_stream=True,
            )
            cw_handler.setFormatter(logging.Formatter(
                "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
            ))
            logger.addHandler(cw_handler)
            logger.info("CloudWatch logging enabled — group: %s, stream: %s", LOG_GROUP, LOG_STREAM)
        except Exception as e:
            logger.warning("CloudWatch logging setup failed: %s", e)

    return logger
