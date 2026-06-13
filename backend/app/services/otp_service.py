import random
import string
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.user import OTPCode

OTP_EXPIRY_MINUTES = 10


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def create_otp(db: Session, phone: str) -> str:
    db.query(OTPCode).filter(
        OTPCode.phone == phone,
        OTPCode.is_used == False,
    ).delete()

    code = generate_otp()
    otp = OTPCode(
        phone=phone,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )
    db.add(otp)
    db.commit()
    return code


def verify_otp(db: Session, phone: str, code: str) -> bool:
    otp = (
        db.query(OTPCode)
        .filter(
            OTPCode.phone == phone,
            OTPCode.code == code,
            OTPCode.is_used == False,
            OTPCode.expires_at > datetime.utcnow(),
        )
        .first()
    )
    if not otp:
        return False
    otp.is_used = True
    db.commit()
    return True


def send_otp(phone: str, code: str) -> dict:
    """
    Simulate OTP sending. Replace with Twilio in production.
    Checks WhatsApp availability first, falls back to SMS.
    """
    # TODO: integrate Twilio WhatsApp + SMS
    print(f"[OTP SIMULATION] Sending code {code} to {phone} via WhatsApp/SMS")
    return {"simulated": True, "phone": phone, "code": code}
