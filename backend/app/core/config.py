from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "dev-secret-key-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    UPLOAD_DIR: str = "uploads"
    SIMULATION_MODE: bool = True
    GOOGLE_BOOKS_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "+14155238886"
    # Numéro Twilio SMS classique, distinct du numéro WhatsApp ci-dessus.
    # Non renseigné par défaut : sans lui, le repli SMS est simplement ignoré
    # et l'échec WhatsApp remonte tel quel (voir send_otp dans otp_service.py).
    TWILIO_SMS_FROM: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
