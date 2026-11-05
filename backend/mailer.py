"""Outgoing email, kept behind one function so the provider can be swapped by configuration.

MAIL_PROVIDER
  console  (default) only writes the message to the server log - for local development and the demo,
           where the seeded ``@educentre.id`` addresses are not real mailboxes.
  smtp     sends through an SMTP server: SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASSWORD,
           SMTP_STARTTLS (true), and MAIL_FROM.
"""
import asyncio
import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger("educentre")


def provider() -> str:
    return os.environ.get("MAIL_PROVIDER", "console").strip().lower()


def _send_smtp(to: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = os.environ.get("MAIL_FROM", "EduCentre <no-reply@educentre.local>")
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    host = os.environ["SMTP_HOST"]
    port = int(os.environ.get("SMTP_PORT", "587"))
    with smtplib.SMTP(host, port, timeout=20) as smtp:
        if os.environ.get("SMTP_STARTTLS", "true").strip().lower() in ("1", "true", "yes"):
            smtp.starttls()
        user = os.environ.get("SMTP_USER")
        if user:
            smtp.login(user, os.environ.get("SMTP_PASSWORD", ""))
        smtp.send_message(msg)


async def send_email(to: str, subject: str, body: str) -> bool:
    """Send one email. Never raises: callers must not leak delivery problems to end users."""
    kind = provider()
    try:
        if kind == "console":
            logger.info("[mail:console] to=%s subject=%s\n%s", to, subject, body)
        elif kind == "smtp":
            await asyncio.to_thread(_send_smtp, to, subject, body)
        else:
            logger.error("Unknown MAIL_PROVIDER %r; email to %s not sent", kind, to)
            return False
        return True
    except Exception:  # noqa: BLE001 - delivery errors are logged, not surfaced
        logger.exception("Could not send email to %s", to)
        return False
