import httpx
import base64
from pathlib import Path
from app.core.config import settings

def get_logo_base64() -> str:
    try:
        current_dir = Path(__file__).parent
        logo_path = current_dir.parent.parent.parent / "frontend" / "public" / "lanes-logo" / "lanes-wbg.png"
        if logo_path.exists():
            with open(logo_path, "rb") as f:
                encoded = base64.b64encode(f.read()).decode("utf-8")
                return f"data:image/png;base64,{encoded}"
    except Exception as e:
        print(f"Error loading logo: {e}")
    return ""

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
    
    logo_src = get_logo_base64()
    logo_html = f"<div style='text-align: center; margin-bottom: 20px;'><img src='{logo_src}' alt='LANES Logo' style='max-width: 200px;'/></div>" if logo_src else ""

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        {logo_html}
        <h2 style="color: #1e3a8a; text-align: center;">LANES Registration</h2>
        <p>Hello,</p>
        <p>Your email verification code is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <strong style="font-size: 32px; letter-spacing: 5px; color: #2563eb; background-color: #eff6ff; padding: 15px 30px; border-radius: 8px;">{otp_code}</strong>
        </div>
        <p>This code will expire in 10 minutes. Please do not share it with anyone.</p>
        <p>Stay safe,<br><strong>The LANES Team</strong></p>
      </body>
    </html>
    """

    payload = {
        "sender": {"name": "LANES", "email": "roicambe02@gmail.com"},
        "to": [{"email": to_email}],
        "subject": "Your LANES Account Verification Code",
        "htmlContent": html_content
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

