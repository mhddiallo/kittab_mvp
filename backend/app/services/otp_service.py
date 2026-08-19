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
    Envoie le code OTP par WhatsApp (Twilio) en priorité — canal le moins
    cher et le mieux implanté en Afrique de l'Ouest. Si l'envoi WhatsApp
    échoue (numéro non inscrit à WhatsApp, erreur de livraison, etc.) et
    qu'un numéro Twilio SMS est configuré, on retente en SMS classique
    plutôt que de laisser l'utilisateur bloqué sans code.
    Si les credentials Twilio ne sont pas configurés, simule l'envoi.
    """
    from app.core.config import settings

    message_body = (
        f"🔐 Votre code de connexion Kittab est : *{code}*\n"
        f"Il est valable pendant 10 minutes."
    )

    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        try:
            client.messages.create(
                from_=f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}",
                to=f"whatsapp:{phone}",
                body=message_body,
            )
            print(f"[OTP] WhatsApp envoyé à {phone}")
            return {"channel": "whatsapp", "phone": phone}
        except Exception as whatsapp_error:
            print(f"[OTP] Erreur Twilio WhatsApp: {whatsapp_error}")
            if not settings.TWILIO_SMS_FROM:
                raise

            try:
                client.messages.create(
                    from_=settings.TWILIO_SMS_FROM,
                    to=phone,
                    body=message_body,
                )
                print(f"[OTP] Repli SMS envoyé à {phone}")
                return {"channel": "sms", "phone": phone}
            except Exception as sms_error:
                print(f"[OTP] Erreur Twilio SMS (repli): {sms_error}")
                raise sms_error from whatsapp_error

    print(f"[OTP SIMULATION] Code {code} pour {phone}")
    return {"simulated": True, "phone": phone, "code": code}
