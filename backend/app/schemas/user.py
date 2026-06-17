from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RequestOTPInput(BaseModel):
    phone: str


class VerifyOTPInput(BaseModel):
    phone: str
    code: str


class CompleteProfileInput(BaseModel):
    first_name: str
    last_name: str
    address: str = ''
    phone: Optional[str] = None
    email: Optional[str] = None


class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: int
    phone: str
    email: Optional[str] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address: Optional[str] = None
    is_profile_complete: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool
    user: UserOut
