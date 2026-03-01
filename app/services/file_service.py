import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "video/mp4",
}
MAX_FILE_SIZE_MB = 10


async def save_file(file: UploadFile, issue_id: str) -> tuple[str, str, str]:
    """
    Save a file to local storage or S3 (depending on STORAGE_BACKEND).
    Returns: (file_name, file_path, file_size_str)
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        from app.core.exceptions import BadRequestException
        raise BadRequestException(f"File type '{file.content_type}' is not allowed")

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        from app.core.exceptions import BadRequestException
        raise BadRequestException(f"File exceeds maximum size of {MAX_FILE_SIZE_MB}MB")

    ext = Path(file.filename).suffix
    unique_name = f"{uuid.uuid4()}{ext}"

    if settings.STORAGE_BACKEND == "s3":
        file_path = await _save_to_s3(contents, unique_name, file.content_type, issue_id)
    else:
        file_path = _save_locally(contents, unique_name, issue_id)

    return file.filename, file_path, f"{round(size_mb, 2)} MB"


def _save_locally(contents: bytes, unique_name: str, issue_id: str) -> str:
    upload_dir = Path(settings.UPLOAD_DIR) / "issues" / issue_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / unique_name
    with open(file_path, "wb") as f:
        f.write(contents)
    logger.info(f"File saved locally: {file_path}")
    return str(file_path)


async def _save_to_s3(contents: bytes, unique_name: str, content_type: str, issue_id: str) -> str:
    import boto3
    s3_key = f"issues/{issue_id}/{unique_name}"
    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    s3.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=s3_key,
        Body=contents,
        ContentType=content_type,
    )
    url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
    logger.info(f"File uploaded to S3: {url}")
    return url
