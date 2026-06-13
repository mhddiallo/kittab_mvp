# Kittab — Backend

## Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # puis éditer avec vos valeurs
```

## Base de données

```bash
# Créer la base PostgreSQL
createdb kittab_db

# Appliquer les migrations
alembic upgrade head
```

## Lancer le serveur

```bash
uvicorn app.main:app --reload
```

API disponible sur http://localhost:8000
Docs Swagger : http://localhost:8000/docs

## Endpoints Auth

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | /api/auth/request-otp | Demander un code OTP |
| POST | /api/auth/verify-otp | Vérifier le code → JWT |
| POST | /api/auth/complete-profile | Compléter le profil (1ère connexion) |
| GET | /api/auth/me | Mon profil |
| PUT | /api/auth/me | Modifier mon profil |

> **Mode simulation** : le code OTP est retourné dans la réponse (`dev_code`).
> En production, brancher Twilio dans `app/services/otp_service.py`.
