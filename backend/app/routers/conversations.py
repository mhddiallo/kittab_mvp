import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.conversation import Conversation, ConversationParticipant, Message
from app.models.book import Book
from app.models.user import User

router = APIRouter(prefix="/conversations", tags=["conversations"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: int
    sender_id: int
    sender_username: Optional[str]
    content: str
    image_url: Optional[str] = None
    created_at: datetime
    read_at: Optional[datetime]
    is_mine: bool

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: int
    other_user: dict
    book: Optional[dict]
    wanted_book: Optional[dict]
    last_message: Optional[MessageOut]
    unread_count: int
    created_at: datetime


class ConversationDetailOut(BaseModel):
    id: int
    other_user: dict
    book: Optional[dict]
    wanted_book: Optional[dict]
    messages: list[MessageOut]


class CreateConversationIn(BaseModel):
    other_user_id: int
    book_id: Optional[int] = None
    wanted_book_id: Optional[int] = None
    initial_message: str


class SendMessageIn(BaseModel):
    content: str
    image_url: Optional[str] = None


# ── Helpers ──────────────────────────────────────────────────────────────────

def _msg_out(msg: Message, current_user_id: int) -> MessageOut:
    return MessageOut(
        id=msg.id,
        sender_id=msg.sender_id,
        sender_username=msg.sender.username if msg.sender else None,
        content=msg.content,
        image_url=msg.image_url,
        created_at=msg.created_at,
        read_at=msg.read_at,
        is_mine=msg.sender_id == current_user_id,
    )


def _find_existing_conversation(db: Session, user_a: int, user_b: int) -> Optional[Conversation]:
    """Find a conversation that has exactly these two participants."""
    from sqlalchemy import and_
    # Get all conversation IDs where user_a is a participant
    a_convs = db.query(ConversationParticipant.conversation_id).filter(
        ConversationParticipant.user_id == user_a
    ).subquery()
    # Get conversation IDs where user_b is also a participant
    result = db.query(ConversationParticipant.conversation_id).filter(
        ConversationParticipant.user_id == user_b,
        ConversationParticipant.conversation_id.in_(a_convs)
    ).first()
    if result:
        return db.get(Conversation, result[0])
    return None


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("", response_model=ConversationDetailOut, status_code=201)
def create_conversation(
    body: CreateConversationIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.other_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Impossible de vous envoyer un message à vous-même")

    other_user = db.get(User, body.other_user_id)
    if not other_user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    # Find or create conversation
    conv = _find_existing_conversation(db, current_user.id, body.other_user_id)

    if not conv:
        conv = Conversation(
            book_id=body.book_id,
            wanted_book_id=body.wanted_book_id,
        )
        db.add(conv)
        db.flush()
        db.add(ConversationParticipant(conversation_id=conv.id, user_id=current_user.id))
        db.add(ConversationParticipant(conversation_id=conv.id, user_id=body.other_user_id))

    # Send initial message
    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=body.initial_message,
    )
    db.add(msg)
    db.commit()
    db.refresh(conv)

    book_dict = None
    if conv.book_id:
        b = db.get(Book, conv.book_id)
        if b:
            book_dict = {"id": b.id, "title": b.title}

    wanted_dict = None
    if conv.wanted_book_id:
        from app.models.wanted_book import WantedBook
        wb = db.get(WantedBook, conv.wanted_book_id)
        if wb:
            wanted_dict = {"id": wb.id, "title": wb.title}

    return ConversationDetailOut(
        id=conv.id,
        other_user={"id": other_user.id, "username": other_user.username},
        book=book_dict,
        wanted_book=wanted_dict,
        messages=[_msg_out(m, current_user.id) for m in conv.messages],
    )


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get all conversation IDs for this user
    user_conv_ids = [
        cp.conversation_id
        for cp in db.query(ConversationParticipant).filter(
            ConversationParticipant.user_id == current_user.id
        ).all()
    ]
    if not user_conv_ids:
        return {"count": 0}

    count = db.query(Message).filter(
        Message.conversation_id.in_(user_conv_ids),
        Message.sender_id != current_user.id,
        Message.read_at.is_(None),
    ).count()
    return {"count": count}


@router.get("", response_model=list[ConversationOut])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    participations = db.query(ConversationParticipant).filter(
        ConversationParticipant.user_id == current_user.id
    ).all()

    result = []
    for part in participations:
        conv = part.conversation
        other_part = next((p for p in conv.participants if p.user_id != current_user.id), None)
        if not other_part:
            continue
        other_user = other_part.user

        last_msg = conv.messages[-1] if conv.messages else None

        unread = sum(
            1 for m in conv.messages
            if m.sender_id != current_user.id and m.read_at is None
        )

        book_dict = None
        if conv.book_id:
            b = db.get(Book, conv.book_id)
            if b:
                book_dict = {"id": b.id, "title": b.title}

        wanted_dict = None
        if conv.wanted_book_id:
            from app.models.wanted_book import WantedBook
            wb = db.get(WantedBook, conv.wanted_book_id)
            if wb:
                wanted_dict = {"id": wb.id, "title": wb.title}

        result.append(ConversationOut(
            id=conv.id,
            other_user={"id": other_user.id, "username": other_user.username},
            book=book_dict,
            wanted_book=wanted_dict,
            last_message=_msg_out(last_msg, current_user.id) if last_msg else None,
            unread_count=unread,
            created_at=conv.created_at,
        ))

    # Sort by last message time desc
    result.sort(
        key=lambda c: c.last_message.created_at if c.last_message else c.created_at,
        reverse=True,
    )
    return result


@router.get("/{conv_id}", response_model=ConversationDetailOut)
def get_conversation(
    conv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    # Check participation
    part = next((p for p in conv.participants if p.user_id == current_user.id), None)
    if not part:
        raise HTTPException(status_code=403, detail="Accès refusé")

    other_part = next((p for p in conv.participants if p.user_id != current_user.id), None)
    other_user = other_part.user if other_part else None

    # Mark unread messages as read
    for msg in conv.messages:
        if msg.sender_id != current_user.id and msg.read_at is None:
            msg.read_at = datetime.utcnow()
    db.commit()
    db.refresh(conv)

    book_dict = None
    if conv.book_id:
        b = db.get(Book, conv.book_id)
        if b:
            book_dict = {"id": b.id, "title": b.title}

    wanted_dict = None
    if conv.wanted_book_id:
        from app.models.wanted_book import WantedBook
        wb = db.get(WantedBook, conv.wanted_book_id)
        if wb:
            wanted_dict = {"id": wb.id, "title": wb.title}

    return ConversationDetailOut(
        id=conv.id,
        other_user={"id": other_user.id, "username": other_user.username} if other_user else {"id": 0, "username": "Inconnu"},
        book=book_dict,
        wanted_book=wanted_dict,
        messages=[_msg_out(m, current_user.id) for m in conv.messages],
    )


@router.post("/{conv_id}/messages", response_model=MessageOut, status_code=201)
def send_message(
    conv_id: int,
    body: SendMessageIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    part = next((p for p in conv.participants if p.user_id == current_user.id), None)
    if not part:
        raise HTTPException(status_code=403, detail="Accès refusé")

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=body.content,
        image_url=body.image_url,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _msg_out(msg, current_user.id)


@router.post("/{conv_id}/messages/image", response_model=MessageOut, status_code=201)
async def send_image_message(
    conv_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    part = next((p for p in conv.participants if p.user_id == current_user.id), None)
    if not part:
        raise HTTPException(status_code=403, detail="Accès refusé")

    # Save the uploaded image
    upload_dir = os.path.join(settings.UPLOAD_DIR, "messages")
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "image")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    image_url = f"/uploads/messages/{filename}"

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content="",
        image_url=image_url,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _msg_out(msg, current_user.id)
