from sqlalchemy.orm import Session

from app.models.alert import BookAlert
from app.models.book import Book


def check_and_notify_alerts(db: Session, book: Book) -> None:
    """Called after a new book is published — notify matching pending alerts."""
    alerts = db.query(BookAlert).filter(BookAlert.is_notified == False).all()
    for alert in alerts:
        if alert.query.lower() in book.title.lower() or alert.query.lower() in book.author.lower():
            _send_alert_notification(alert.notification_phone, book, alert.query)
            alert.is_notified = True
    db.commit()


def _send_alert_notification(phone: str, book: Book, query: str) -> None:
    message = (
        f"[Kittab] Le livre que vous cherchiez est disponible : "
        f'"{ book.title}" par {book.author} à {book.price} GNF. '
        f"Connectez-vous sur Kittab pour contacter le vendeur."
    )
    # TODO: replace with Twilio WhatsApp + SMS
    print(f"[ALERT SIMULATION] SMS to {phone}: {message}")
