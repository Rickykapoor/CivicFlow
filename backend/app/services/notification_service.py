import logging
import asyncio
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body: str) -> None:
    """Send email notification. Falls back to logging if mail is disabled."""
    if not settings.MAIL_ENABLED:
        logger.info(f"[MAIL DISABLED] To: {to} | Subject: {subject}")
        return

    try:
        from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

        conf = ConnectionConfig(
            MAIL_USERNAME=settings.MAIL_USERNAME,
            MAIL_PASSWORD=settings.MAIL_PASSWORD,
            MAIL_FROM=settings.MAIL_FROM,
            MAIL_PORT=settings.MAIL_PORT,
            MAIL_SERVER=settings.MAIL_SERVER,
            MAIL_STARTTLS=settings.MAIL_STARTTLS,
            MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
            USE_CREDENTIALS=True,
        )
        message = MessageSchema(subject=subject, recipients=[to], body=body, subtype="html")
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"Email sent to {to}: {subject}")
    except Exception as exc:
        logger.error(f"Failed to send email to {to}: {exc}")


async def notify_issue_created(reporter_email: str, issue_title: str, issue_id: str) -> None:
    subject = f"Issue Reported: {issue_title}"
    body = f"""
    <h2>Your issue has been received!</h2>
    <p><strong>Issue ID:</strong> {issue_id}</p>
    <p><strong>Title:</strong> {issue_title}</p>
    <p>We will keep you updated on the progress. Thank you for helping improve our city!</p>
    """
    await send_email(reporter_email, subject, body)


async def notify_status_changed(user_email: str, issue_title: str, new_status: str) -> None:
    subject = f"Issue Update: {issue_title}"
    body = f"""
    <h2>Issue Status Updated</h2>
    <p><strong>Issue:</strong> {issue_title}</p>
    <p><strong>New Status:</strong> <strong>{new_status}</strong></p>
    <p>Thank you for your patience.</p>
    """
    await send_email(user_email, subject, body)
