"""
Email Digest Module for Garrett

Sends the daily research digest via:
- SMTP (Gmail, etc.)
- SendGrid API

Configure via environment variables.
"""

import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import requests

logger = logging.getLogger('garrett.email')


class EmailDigest:
    """Handles sending email digests."""

    def __init__(self):
        self.method = os.getenv('EMAIL_METHOD', 'smtp').lower()
        self.from_email = os.getenv('EMAIL_FROM')
        self.to_email = os.getenv('EMAIL_TO')

        if not self.to_email:
            logger.warning("EMAIL_TO not configured - emails will be logged only")

        # SMTP config
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_password = os.getenv('SMTP_PASSWORD')

        # SendGrid config
        self.sendgrid_key = os.getenv('SENDGRID_API_KEY')

    def send_digest(self, digest: dict) -> bool:
        """
        Send the daily digest email.

        Args:
            digest: dict with subject, html_body, text_body

        Returns:
            True if sent successfully
        """
        subject = digest.get('subject', 'Garrett: Daily Research Digest')
        html_body = digest.get('html_body', '')
        text_body = digest.get('text_body', '')

        logger.info(f"Sending digest: {subject}")

        if not self.to_email:
            logger.info("No recipient configured - logging digest instead:")
            logger.info(f"Subject: {subject}")
            logger.info(f"Body:\n{text_body[:500]}...")
            return True

        if self.method == 'sendgrid':
            return self._send_via_sendgrid(subject, html_body, text_body)
        else:
            return self._send_via_smtp(subject, html_body, text_body)

    def _send_via_smtp(self, subject: str, html_body: str, text_body: str) -> bool:
        """Send email via SMTP."""
        if not all([self.smtp_user, self.smtp_password]):
            logger.error("SMTP credentials not configured")
            return False

        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email or self.smtp_user
            msg['To'] = self.to_email

            # Attach plain text and HTML versions
            if text_body:
                msg.attach(MIMEText(text_body, 'plain'))
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))

            # Connect and send
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {self.to_email}")
            return True

        except smtplib.SMTPAuthenticationError:
            logger.error("SMTP authentication failed - check credentials")
            logger.error("For Gmail, use an App Password: https://support.google.com/accounts/answer/185833")
            return False

        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {e}")
            return False

    def _send_via_sendgrid(self, subject: str, html_body: str, text_body: str) -> bool:
        """Send email via SendGrid API."""
        if not self.sendgrid_key:
            logger.error("SENDGRID_API_KEY not configured")
            return False

        payload = {
            'personalizations': [{
                'to': [{'email': self.to_email}]
            }],
            'from': {'email': self.from_email},
            'subject': subject,
            'content': []
        }

        if text_body:
            payload['content'].append({
                'type': 'text/plain',
                'value': text_body
            })

        if html_body:
            payload['content'].append({
                'type': 'text/html',
                'value': html_body
            })

        try:
            response = requests.post(
                'https://api.sendgrid.com/v3/mail/send',
                headers={
                    'Authorization': f'Bearer {self.sendgrid_key}',
                    'Content-Type': 'application/json'
                },
                json=payload,
                timeout=30
            )

            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully via SendGrid to {self.to_email}")
                return True
            else:
                logger.error(f"SendGrid error: {response.status_code} - {response.text}")
                return False

        except Exception as e:
            logger.error(f"Failed to send email via SendGrid: {e}")
            return False


# Quick test
if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv()

    email = EmailDigest()

    test_digest = {
        'subject': 'Test: Garrett Daily Digest',
        'html_body': '''
            <html>
            <body style="font-family: sans-serif;">
                <h2>Test Digest</h2>
                <p>This is a test email from Garrett.</p>
                <ul>
                    <li><strong>Part Found:</strong> GM 3917291 Intake Manifold</li>
                    <li><strong>Price:</strong> $450 at Summit Racing</li>
                </ul>
                <p>Happy wrenching!<br>- Garrett</p>
            </body>
            </html>
        ''',
        'text_body': '''
            Test Digest

            This is a test email from Garrett.

            - Part Found: GM 3917291 Intake Manifold
            - Price: $450 at Summit Racing

            Happy wrenching!
            - Garrett
        '''
    }

    print("Sending test email...")
    success = email.send_digest(test_digest)
    print(f"Result: {'Success' if success else 'Failed'}")
