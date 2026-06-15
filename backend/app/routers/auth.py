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


@router.post("/request-otp", status_code=status.HTTP_200_OK)
def request_otp(payload: RequestOTPInput, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Numéro de téléphone invalide")

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


@router.post("/complete-profile", response_model=UserOut)
def complete_profile(
    payload: CompleteProfileInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.first_name = payload.first_name.strip()
    current_user.last_name = payload.last_name.strip()
    current_user.address = payload.address.strip()
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
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)
