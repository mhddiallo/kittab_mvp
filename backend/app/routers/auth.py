from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.user import (
    CompleteProfileInput,
    RequestOTPInput,
    TokenResponse,
    UserOut,
    UserUpdate,
    VerifyOTPInput,
)
from app.services.otp_service import create_otp, send_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleTokenInput(BaseModel):
    credential: str


def _validate_phone(phone: str):
    import re
    digits = re.sub(r'\D', '', phone)
    if len(digits) < 7 or len(digits) > 15:
        raise HTTPException(status_code=400, detail="Numéro de téléphone invalide (7 à 15 chiffres)")


@router.post("/request-otp", status_code=status.HTTP_200_OK)
def request_otp(payload: RequestOTPInput, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Numéro de téléphone invalide")
    _validate_phone(phone)

    code = create_otp(db, phone)
    result = send_otp(phone, code)

    response = {"message": "Code OTP envoyé", "phone": phone}
    if result.get("simulated"):
        response["dev_code"] = code
    return response


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp_endpoint(payload: VerifyOTPInput, db: Session = Depends(get_db)):
    phone = payload.phone.strip()

    if not verify_otp(db, phone, payload.code):
        raise HTTPException(status_code=400, detail="Code OTP invalide ou expiré")

    user = db.query(User).filter(User.phone == phone).first()
    is_new_user = user is None

    if is_new_user:
        user = User(phone=phone)
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=token,
        is_new_user=is_new_user,
        user=UserOut.model_validate(user),
    )


@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleTokenInput, db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth non configuré")
    try:
        info = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Token Google invalide")

    google_id = info["sub"]
    email = info.get("email", "")
    first_name = info.get("given_name", "")
    last_name = info.get("family_name", "")

    user = db.query(User).filter(User.google_id == google_id).first()
    is_new_user = user is None

    if is_new_user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_id = google_id
        else:
            user = User(
                google_id=google_id,
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=f"google_{google_id}",
                is_profile_complete=bool(first_name and last_name),
            )
            db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return TokenResponse(
        access_token=token,
        is_new_user=is_new_user,
        user=UserOut.model_validate(user),
    )


class GoogleCompleteInput(BaseModel):
    first_name: str
    last_name: str
    phone: str
    otp_code: str
    email: str | None = None
    address: str | None = None


@router.post("/google/complete", response_model=TokenResponse)
def google_complete(
    payload: GoogleCompleteInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.phone.startswith('google_'):
        raise HTTPException(status_code=400, detail="Action non autorisée")

    phone = payload.phone.strip()
    _validate_phone(phone)

    if not verify_otp(db, phone, payload.otp_code):
        raise HTTPException(status_code=400, detail="Code OTP invalide ou expiré")

    existing = db.query(User).filter(User.phone == phone, User.id != current_user.id).first()

    if existing:
        # Fusionner : ajouter google_id/email au compte téléphone existant
        existing.google_id = current_user.google_id
        if payload.email and not existing.email:
            existing.email = payload.email.strip()
        if payload.first_name and not existing.first_name:
            existing.first_name = payload.first_name.strip()
        if payload.last_name and not existing.last_name:
            existing.last_name = payload.last_name.strip()
        existing.is_profile_complete = True
        # Supprimer le compte Google temporaire
        db.delete(current_user)
        db.commit()
        db.refresh(existing)
        token = create_access_token(subject=str(existing.id))
        return TokenResponse(access_token=token, is_new_user=False, user=UserOut.model_validate(existing))
    else:
        # Nouveau numéro → compléter le compte Google actuel
        current_user.phone = phone
        current_user.first_name = payload.first_name.strip()
        current_user.last_name = payload.last_name.strip()
        if payload.email:
            current_user.email = payload.email.strip()
        if payload.address:
            current_user.address = payload.address.strip()
        current_user.is_profile_complete = True
        db.commit()
        db.refresh(current_user)
        token = create_access_token(subject=str(current_user.id))
        return TokenResponse(access_token=token, is_new_user=True, user=UserOut.model_validate(current_user))


@router.post("/complete-profile", response_model=UserOut)
def complete_profile(
    payload: CompleteProfileInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.first_name = payload.first_name.strip()
    current_user.last_name = payload.last_name.strip()
    current_user.address = payload.address.strip() if payload.address else ''
    if payload.phone and current_user.phone.startswith('google_'):
        current_user.phone = payload.phone.strip()
    if payload.email:
        current_user.email = payload.email.strip()
    current_user.is_profile_complete = True
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.put("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.first_name is not None:
        current_user.first_name = payload.first_name.strip()
    if payload.last_name is not None:
        current_user.last_name = payload.last_name.strip()
    if payload.address is not None:
        current_user.address = payload.address.strip()
    if payload.phone is not None and current_user.phone.startswith('google_'):
        current_user.phone = payload.phone.strip()
    if current_user.first_name and current_user.last_name:
        current_user.is_profile_complete = True
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)
