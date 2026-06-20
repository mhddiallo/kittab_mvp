from sqlalchemy.orm import Session

from app.models.alert import BookAlert
from app.models.book import Book


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
    title_match = alert.query.lower() in book.title.lower()
    author_match = bool(alert.author and alert.author.lower() in book.author.lower())
    # Si auteur précisé : les deux doivent matcher. Sinon titre suffit.
    if alert.author:
        return title_match and author_match
    return title_match


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
