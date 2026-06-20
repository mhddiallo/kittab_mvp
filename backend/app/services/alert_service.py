from difflib import SequenceMatcher
from sqlalchemy.orm import Session

from app.models.alert import BookAlert
from app.models.book import Book


def _similar(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def check_and_notify_alerts(db: Session, book: Book) -> None:
    """Called after a new book is published — notify matching pending alerts."""
    alerts = db.query(BookAlert).filter(BookAlert.is_notified == False).all()
    for alert in alerts:
        if _matches(alert, book):
            if alert.email:
                _send_email_notification(alert.email, book, alert.query)
            elif alert.notification_phone:
                _send_sms_notification(alert.notification_phone, book, alert.query)
            alert.is_notified = True
    db.commit()


def _matches(alert: BookAlert, book: Book) -> bool:
    # Tolérant aux fautes de frappe : "Vol de Nouit" matche "Vol de nuit"
    title_match = _similar(alert.query, book.title) > 0.75
    if not title_match:
        return False
    if alert.author:
        return _similar(alert.author, book.author) > 0.75
    return True


def _send_email_notification(email: str, book: Book, query: str) -> None:
    # TODO: intégrer Resend
    print(
        f"[EMAIL SIMULATION] To: {email} | "
        f'Livre disponible : "{book.title}" par {book.author} à {book.price} FCFA'
    )


def _send_sms_notification(phone: str, book: Book, query: str) -> None:
    # TODO: intégrer Twilio/WhatsApp
    print(
        f"[SMS SIMULATION] To: {phone} | "
        f'Livre disponible : "{book.title}" par {book.author} à {book.price} FCFA'
    )
