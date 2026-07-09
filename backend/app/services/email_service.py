import httpx
from app.core.config import settings

async def send_otp_email_async(to_email: str, otp_code: str) -> bool:
    """
    Sends an OTP email using Brevo REST API.
    """
    if not settings.BREVO_SMTP_KEY:
        print(f"WARN: Brevo API Key not set. Simulating OTP {otp_code} to {to_email}")
        return True

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_SMTP_KEY,
        "content-type": "application/json"
    }
    
    # Normally, sender email must be verified in Brevo.
    # If noreply@lanes.local fails, we will see it in the logs.
    payload = {
        "sender": {"name": "LANES", "email": "roicambe02@gmail.com"},
        "to": [{"email": to_email}],
        "subject": "Your LANES Account Verification Code",
        "htmlContent": f"<html><body><h2>LANES Registration</h2><p>Hello,</p><p>Your email verification code is: <strong style='font-size:24px;'>{otp_code}</strong></p><p>This code will expire in 10 minutes. Please do not share it with anyone.</p><p>Stay safe,<br>The LANES Team</p></body></html>"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            response.raise_for_status()
            return True
        except httpx.HTTPStatusError as e:
            print(f"Error sending email via Brevo API: HTTP {e.response.status_code} - {e.response.text}")
            return False
        except Exception as e:
            print(f"Error sending email via Brevo API: {e}")
            return False
