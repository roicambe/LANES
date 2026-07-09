import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.crud import otp as crud_otp
from app.schemas.otp import OTPVerificationCreate
from app.services.email_service import send_otp_email_async
import bcrypt

def get_otp_hash(otp_code: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(otp_code.encode('utf-8'), salt).decode('utf-8')

def verify_otp_hash(plain_otp: str, hashed_otp: str) -> bool:
    try:
        return bcrypt.checkpw(plain_otp.encode('utf-8'), hashed_otp.encode('utf-8'))
    except ValueError:
        return False

def generate_otp_code() -> str:
    # Generate 6 digit numeric code
    return str(secrets.randbelow(1000000)).zfill(6)


async def generate_and_send_otp(db: Session, email: str) -> bool:
    """
    Generate a 6-digit OTP, hash it, store it in the database, and send it to the user.
    """
    code = generate_otp_code()
    hashed_code = get_otp_hash(code)
    
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    otp_in = OTPVerificationCreate(
        email=email,
        otp_code=hashed_code,
        expires_at=expires_at
    )
    
    crud_otp.create_otp(db, otp_in)
    
    # Send via email service
    success = await send_otp_email_async(to_email=email, otp_code=code)
    return success

def validate_otp(db: Session, email: str, plain_otp: str) -> bool:
    """
    Validates an OTP. Handles attempts and expiry.
    """
    otp_record = crud_otp.get_latest_otp(db, email=email)
    if not otp_record:
        return False
        
    if otp_record.is_verified:
        return False
        
    if otp_record.attempts >= 3:
        return False
        
    if datetime.utcnow() > otp_record.expires_at:
        return False
        
    # Verify hash
    if verify_otp_hash(plain_otp, otp_record.otp_code):
        crud_otp.mark_otp_verified(db, otp_record.id)
        return True
    else:
        crud_otp.increment_otp_attempts(db, otp_record.id)
        return False
