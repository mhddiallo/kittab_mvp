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
    Envoie le code OTP via WhatsApp (Twilio).
    Si les credentials Twilio ne sont pas configurés, simule l'envoi.
    """
    from app.core.config import settings

    message_body = (
        f"🔐 Votre code de connexion Kittab est : *{code}*\n"
        f"Il est valable pendant 10 minutes."
    )

    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            client.messages.create(
                from_=f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}",
                to=f"whatsapp:{phone}",
                body=message_body,
            )
            print(f"[OTP] WhatsApp envoyé à {phone}")
            return {"channel": "whatsapp", "phone": phone}
        except Exception as e:
            print(f"[OTP] Erreur Twilio: {e}")
            raise

    print(f"[OTP SIMULATION] Code {code} pour {phone}")
    return {"simulated": True, "phone": phone, "code": code}
