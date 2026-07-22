# Générer l'APK Android AgroField (Play Store)

## Prérequis
- Node/Bun installés
- **Android Studio** (dernière version) + JDK 17
- Compte Google Play Console (**25 USD**, paiement unique)

## 1. Installer Capacitor

```bash
bun add @capacitor/core @capacitor/cli
bun add @capacitor/android
bun add @capacitor/camera @capacitor/geolocation @capacitor/preferences @capacitor/splash-screen @capacitor/status-bar
bun add @capacitor-community/bluetooth-le
```

## 2. Initialiser le projet Android

`capacitor.config.ts` est déjà dans le repo.

```bash
bun run build              # génère .output/public
bunx cap add android
bunx cap sync
```

## 3. Configurer AndroidManifest.xml

`android/app/src/main/AndroidManifest.xml` — ajouter dans `<manifest>` :

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

## 4. Icônes et splash

Génère les assets avec **capacitor-assets** :

```bash
bun add -d @capacitor/assets
# Place logo.png (1024x1024) et splash.png (2732x2732) dans /resources
bunx capacitor-assets generate --android
```

## 5. Ouvrir dans Android Studio

```bash
bunx cap open android
```

Dans Android Studio :
- **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**
- Créer une keystore (garde-la précieusement, tu en auras besoin pour chaque mise à jour).
- Choisir "release".
- Le `.aab` est dans `android/app/release/`.

## 6. Fiche Play Console

- Nom : **AgroField — Assistant agricole**
- Description courte (80 car.) : *Gère parcelles, dépenses et maladies des cultures. IA agricole ouest-africaine.*
- Description longue (rédigée en FR)
- Screenshots : **2 minimum** en 1080×1920 (dashboard, parcelles, diagnostic IA)
- Icône 512×512
- Bannière feature 1024×500
- **Politique de confidentialité** (obligatoire) : `https://<ton-domaine>/privacy`
- Catégorie : **Productivité** ou **Outils professionnels**
- Classement : **Tous publics**
- Public cible : Adultes (agriculteurs)

## 7. Publier

1. **App bundle → Créer un test fermé** (upload .aab).
2. Ajouter 5-10 testeurs par email.
3. Vérifier pendant 3-7 jours.
4. **Promouvoir en production** → revue Google (2-7 jours) → publication.

## Mises à jour

Chaque nouvelle version :
```bash
bun run build && bunx cap sync
# Incrémenter versionCode dans android/app/build.gradle
# Rebuild .aab avec la même keystore → upload sur Play Console
```

## Alternative rapide sans Android Studio : PWABuilder

Si tu veux juste tester : https://www.pwabuilder.com → coller ton URL Cloudflare → télécharge un `.aab` généré automatiquement. Moins de contrôle mais 5 minutes.
