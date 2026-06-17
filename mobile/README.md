# Kittab Mobile (Flutter)

## Setup

### 1. Installer Flutter
https://docs.flutter.dev/get-started/install/windows

### 2. Installer les dépendances
```bash
cd mobile
flutter pub get
```

### 3. Lancer sur Android (émulateur ou téléphone)
```bash
flutter run
```

### 4. Build APK
```bash
flutter build apk --release
```

## Structure
```
lib/
  core/          # API client, auth service
  models/        # Book, Seller, etc.
  screens/       # Un dossier par écran
  widgets/       # Composants réutilisables
  theme/         # Couleurs, typographie
  main.dart      # Point d'entrée + routing
assets/
  images/        # Logo, illustrations
  fonts/         # Inter
```
