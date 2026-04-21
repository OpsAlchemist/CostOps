"""CloudWatch logging configuration using watchtower."""

import os
import logging
import boto3
import watchtower

LOG_GROUP = os.getenv("CLOUDWATCH_LOG_GROUP", "CostOpsTest")
AWS_REGION = os.getenv("DB_REGION", "us-east-1")
ENABLE_CLOUDWATCH = os.getenv("ENABLE_CLOUDWATCH", "true").lower() == "true"

# Determine environment from branch name
BRANCH = os.getenv("VERCEL_GIT_COMMIT_REF", os.getenv("GIT_BRANCH", "local"))
ENV_LABEL = "production" if BRANCH == "main" else f"dev-{BRANCH}" if BRANCH != "local" else "local"
LOG_STREAM = os.getenv("CLOUDWATCH_LOG_STREAM", ENV_LABEL)


def setup_logging():
    """Configure root logger to send logs to CloudWatch and stdout."""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Always log to stdout
    stdout_handler = logging.StreamHandler()
    stdout_handler.setFormatter(logging.Formatter(
        f"%(asctime)s [{ENV_LABEL}] [%(levelname)s] %(name)s: %(message)s"
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
                f"%(asctime)s [{ENV_LABEL}] [%(levelname)s] %(name)s: %(message)s"
            ))
            logger.addHandler(cw_handler)
            logger.info("CloudWatch logging enabled — group: %s, stream: %s", LOG_GROUP, LOG_STREAM)
        except Exception as e:
            logger.warning("CloudWatch logging setup failed: %s", e)

    return logger
