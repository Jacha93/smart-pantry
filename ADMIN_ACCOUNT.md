# Admin Account Zugangsdaten

## Standard-Zugangsdaten

Der Admin-Account wird automatisch beim Start des Backend-Servers erstellt, falls er noch nicht existiert.

### Standard-Credentials:

- **Email:** `admin@smartpantry.app`
- **Username:** `admin`
- **Password:** `admin123`
- **Full Name:** `Administrator`
- **Role:** `ADMIN`

## Anpassung der Zugangsdaten

Die Zugangsdaten können über Umgebungsvariablen angepasst werden:

```bash
ADMIN_USER_EMAIL=admin@smartpantry.app
ADMIN_USER_NAME=Admin User
ADMIN_USER_PASSWORD=dein_sicheres_passwort
ADMIN_USER_FULLNAME=Administrator
ADMIN_USER_USERNAME=admin
```

## Admin-Berechtigungen

Der Admin-Account hat folgende Sonderrechte:

- ✅ **Unbegrenzte Quotas:** Alle Limits sind auf `-1` (unbegrenzt) gesetzt
- ✅ **Admin-Panel:** Zugriff auf `/admin/users` und `/admin/switch` Endpoints
- ✅ **User-Switch:** Kann zu jedem User-Account wechseln (für Testing)
- ✅ **Priority Support:** Aktiviert
- ✅ **Notifications:** Aktiviert

## Sicherheitshinweis

⚠️ **WICHTIG:** Ändere das Standard-Passwort in Production!

Setze in deiner `.env` Datei:
```bash
ADMIN_USER_PASSWORD=dein_sehr_sicheres_passwort_hier
```

## Verwendung

1. Logge dich mit den Admin-Credentials ein
2. Gehe zum Profil (`/profile`)
3. Im Profil-Tab siehst du das "Admin Panel" (nur für Admins sichtbar)
4. Dort kannst du zu anderen User-Accounts wechseln, indem du die User-ID eingibst

## API-Endpoints (nur für Admins)

- `GET /admin/users` - Liste aller Benutzer
- `POST /admin/switch` - Wechsel zu einem anderen User-Account

