# Smart Pantry 🥘

Eine intelligente KI-gestützte Lebensmittel-Inventarverwaltung mit automatischer Bildanalyse und Rezeptvorschlägen.

> **⚠️ Disclaimer:** Dieses Projekt ist ein Experiment und wird im Rahmen eines Selbststudiums in Zusammenarbeit mit einer KI programmiert (kein stumpfes VibeCoding). Der Code dient Lernzwecken und sollte nicht als Produktionscode betrachtet werden.

## 🚀 Features

- **Lebensmittel-Inventarverwaltung**: Verwalte dein Vorratslager zentral
- **KI-gestützte Foto-Analyse**: Analysiere Kühlschrank-Fotos mit Google Gemini AI
- **Intelligente Rezeptvorschläge**: Passende Rezepte basierend auf verfügbaren Zutaten
- **Einkaufslisten & Aufgaben**: Generiere automatisch Einkaufslisten
- **Rezept-Management**: Speichere eigene oder AI-generierte Rezepte
- **Refresh Tokens & Quoten**: Sichere Sessions + konfigurierbare KI- und API-Kontingente
- **Mehrsprachig**: Unterstützung für Deutsch und Englisch

## 📋 Technologien

- **Frontend**: Vite 6.x, React 19.x, React Router 7, TypeScript 5.1+, TailwindCSS 4
- **Backend**: Python 3.13, FastAPI, SQLModel
- **Datenbank**: Supabase (PostgreSQL as a Service)
- **KI**: Google Gemini 3 Flash (Bildanalyse & Chat), Spoonacular API (Rezepte)
- **Container**: Docker (einzelnes Image mit Frontend + Backend)
- **Build**: Vite (Frontend), uvicorn (Backend)

### 🔄 Tech-Stack Migration (v1.0.0)

**v1.0.0** markiert den vollständigen Tech-Stack-Wechsel des Projekts:

- **Backend**: Migration von Express.js/Node.js zu FastAPI/Python 3.13
- **ORM**: Wechsel von Prisma zu SQLModel (SQLAlchemy-basiert)
- **Frontend**: Migration zu Vite 6.x Build-System (von Webpack/CRA)
- **React**: Upgrade auf React 19.x mit React Router 7

Siehe [CHANGELOG.md](./CHANGELOG.md) für detaillierte Migrationshinweise und Breaking Changes.

## 🛠️ Installation

### Voraussetzungen

- Node.js 20+
- Python 3.13+
- npm oder yarn
- **Supabase Account** (für PostgreSQL-Datenbank)
- Google Gemini API Key (optional, für Bildanalyse)
- Spoonacular API Key (optional, für Rezepte)

### Lokale Entwicklung

1. **Repository klonen**
   ```bash
   git clone https://github.com/Jacha93/smart-pantry.git
   cd smart-pantry
   ```

2. **Frontend-Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Backend-Abhängigkeiten installieren**
   ```bash
   cd backend_python
   pip install -r requirements.txt
   cd ..
   ```

4. **Supabase Setup**
   - Erstelle ein Projekt auf [Supabase](https://supabase.com)
   - Kopiere die Connection String (DATABASE_URL) aus den Project Settings
   - Die URL sieht aus wie: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

5. **Backend-Umgebungsvariablen setzen (`backend_python/.env`)**
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   JWT_SECRET=CHANGE_ME_JWT_SECRET
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   SPOONACULAR_API_KEY=YOUR_SPOONACULAR_API_KEY
   BACKEND_PORT=3001
   ```

6. **Frontend-Umgebungsvariablen (`.env`)**
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_AUTH_DISABLED=false
   # Optional: Aktiviert lokalen Mock-Login ohne Backend/Datenbank
   VITE_USE_MOCK_AUTH=false
   ```

7. **Backend & Frontend starten**

   **Option 1: Mit Script (empfohlen)**
   ```bash
   npm run dev:all
   ```

   **Option 2: Manuell in separaten Terminals**
   ```bash
   # Terminal 1: Backend
   cd backend_python
   python -m uvicorn app.main:app --reload --port 3001

   # Terminal 2: Frontend
   npm run dev
   ```

   - Frontend: http://localhost:5173 (Vite Dev Server)
   - Backend: http://localhost:3001

### Lokale Tests ohne Backend oder Datenbank

Wenn du das Projekt auf einem Entwicklungsrechner ohne Supabase ausführst, kannst du den **Mock-Auth-Modus** aktivieren:

- Setze in deiner `.env`:
  ```env
  VITE_USE_MOCK_AUTH=true
  VITE_AUTH_DISABLED=false
  ```
- Damit werden Registrierung und Login komplett im Browser (LocalStorage) abgewickelt.  
- Sobald du auf einem Server mit echter Datenbank arbeitest, stelle `VITE_USE_MOCK_AUTH=false`, damit das Frontend wieder mit dem FastAPI-Backend spricht.

## 🔓 Demo-Modus (Login deaktivieren)

Für Präsentationen ist der Login im Entwicklungsmodus automatisch deaktiviert. Das Backend nutzt einen Demo-User (`demo@smartpantry.app`) und das Frontend lässt den Zugriff ohne Token zu.

- **Standard-Credentials (falls Login trotzdem genutzt wird):**  
  `demo@smartpantry.app` / `demo123`
- **Demo-Modus erzwingen (z. B. Produktion):**
  - Backend: `AUTH_DISABLED=true`
  - Frontend: `VITE_AUTH_DISABLED=true`
- **Login wieder aktivieren:** Setze beide Variablen explizit auf `false`.

## 🐳 Docker & Homelab Deployment

### Production Deployment mit Docker Compose

Das Projekt wird automatisch bei jedem Push zu `main`, `dev` oder `agent` als Docker Image gebaut und zu GitHub Container Registry (ghcr.io) gepusht:

- **Latest**: `ghcr.io/jacha93/smart-pantry:latest` (nur von main)
- **Versioned**: `ghcr.io/jacha93/smart-pantry:v1.0.0` (Semantic Versioning via Semantic Release)
- **Dev/Nightly** (von dev branch):
  - `ghcr.io/jacha93/smart-pantry:dev` (immer aktuellster dev Build)
  - `ghcr.io/jacha93/smart-pantry:nightly` (immer aktuellster nightly Build)
  - `ghcr.io/jacha93/smart-pantry:1.0.0-dev` (Version + Suffix)
  - `ghcr.io/jacha93/smart-pantry:1.0.0-nightly` (Version + Suffix)
  - `ghcr.io/jacha93/smart-pantry:1.0.0-nightly-<sha>` (Version + Suffix + Git SHA für eindeutige Identifikation)
- **Pre-Alpha** (von agent branch):
  - `ghcr.io/jacha93/smart-pantry:pre-alpha` (immer aktuellster agent Build)
  - `ghcr.io/jacha93/smart-pantry:1.0.0-pre-alpha` (Version + Suffix)
  - `ghcr.io/jacha93/smart-pantry:1.0.0-pre-alpha-<sha>` (Version + Suffix + Git SHA)

**Versionierung**: Die Version wird automatisch durch [Semantic Release](https://github.com/semantic-release/semantic-release) basierend auf Commit-Messages berechnet:
- `feat:` → Minor Version (v1.0.0 → v1.1.0)
- `fix:` → Patch Version (v1.0.0 → v1.0.1)
- `BREAKING CHANGE:` → Major Version (v1.0.0 → v2.0.0)

**v1.0.0** markiert den vollständigen Tech-Stack-Wechsel (FastAPI/Python + Vite 6). Siehe [CHANGELOG.md](./CHANGELOG.md) für Details.

#### Schnellstart für Homelab

1. **Repository klonen**
   ```bash
   git clone https://github.com/Jacha93/smart-pantry.git
   cd smart-pantry
   ```

2. **Umgebungsvariablen einrichten**
   ```bash
   cp example.env .env
   # Bearbeite .env und fülle alle Werte aus (siehe unten)
   ```

3. **Docker Compose starten**
   ```bash
   docker compose up -d
   ```
   
   **Hinweis**: Beim ersten Start kann es 1-2 Minuten dauern, bis das Image von GitHub Container Registry gepullt wurde.

Die App läuft dann auf:
- **Frontend**: http://localhost:${FRONTEND_PORT:-3000} (Host-Port, konfigurierbar über `.env`)
- **Backend**: Intern im Container auf Port 3001, erreichbar über Nginx Proxy (`/api`)

> **Container-Ports sind hardcoded**: Frontend 3000, Backend 3001  
> **Nur `FRONTEND_PORT` ist konfigurierbar** für den Host-Port des Frontends  
> **Backend kommuniziert intern** mit Frontend über Nginx Proxy (`/api` → `localhost:3001`)

#### Umgebungsvariablen konfigurieren

Die `.env.example` Datei enthält alle benötigten Variablen mit Beschreibungen:

**Frontend (VITE_*):**
- `VITE_API_URL` - Backend API URL (Standard: `http://localhost:3001`)
- `VITE_AUTH_DISABLED` - Auth deaktivieren (Standard: `false`)
- `VITE_USE_MOCK_AUTH` - Mock-Auth für lokale Entwicklung (Standard: `false`)

**Backend:**
- `DATABASE_URL` - Supabase Connection String (erforderlich)
- `JWT_SECRET` - JWT Secret für Token-Generierung (mindestens 32 Zeichen)
- `GEMINI_API_KEY` - Google Gemini API Key (optional)
- `SPOONACULAR_API_KEY` - Spoonacular API Key (optional)
- `BACKEND_PORT` - Backend Port (Standard: `3001`)

**Docker:**
- `FRONTEND_PORT` - Host-Port für Frontend (Standard: `3000`)

**Wichtig**: 
- `JWT_SECRET` sollte mindestens 32 zufällige Zeichen sein
- `DATABASE_URL` muss von Supabase kopiert werden
- Alle Passwörter sollten stark und eindeutig sein
- **Container-Ports sind hardcoded**: Frontend 3000, Backend 3001
- **Nur `FRONTEND_PORT` ist konfigurierbar** für den Host-Port des Frontends
- **Backend ist nur intern erreichbar** - Kommunikation erfolgt über Nginx Proxy (`/api`)

### Docker Image Struktur

Das Docker Image enthält:
- **Frontend**: Vite Build (statische Dateien in `/app/frontend/dist`)
- **Backend**: Python/FastAPI mit uvicorn
- **Nginx**: Dient Frontend-Dateien und proxied API-Requests zum Backend

**Einzelnes Image**: Frontend und Backend laufen im selben Container, was Deployment vereinfacht.

## 🔒 Sicherheit

- **Keine API Keys im Code**: Alle Secrets werden über Umgebungsvariablen bereitgestellt
- **JWT + Refresh Tokens**: Kurzlebige Access Tokens, Refresh Tokens in Supabase widerrufbar
- **Quoten & Limits**: KI- und API-Aufrufe werden pro Nutzer protokolliert und limitiert
- **CORS**: Konfigurierbar für Production (aktuell für Development offen)

## 📝 Version

Aktuelle Version: **v1.0.0**

> **v1.0.0** markiert den vollständigen Tech-Stack-Wechsel des Projekts:
> - Backend: Express.js/Node.js → FastAPI/Python 3.13
> - Frontend: Legacy Build-System → Vite 6.x + React 19.x
> - ORM: Prisma → SQLModel
> 
> Siehe [CHANGELOG.md](./CHANGELOG.md) für detaillierte Release Notes und Migrationshinweise.

## 🌿 Branches

- `main`: Production-ready Code
- `dev`: Development-Branch (nightly builds)

## 🤝 Beitragen & Feedback

Wir freuen uns über Feedback und Verbesserungsvorschläge! Bitte beachte folgende Richtlinien:

### Issues melden
- **Bug Reports**: Wenn du einen Fehler findest, öffne bitte ein [Issue](https://github.com/Jacha93/smart-pantry/issues/new) mit einer detaillierten Beschreibung
- **Feature Requests**: Vorschläge für neue Features sind willkommen
- **Fragen**: Bei Fragen zur Nutzung kannst du ebenfalls ein Issue öffnen

### Wichtige Hinweise
- **Keine Forks**: Dieses Projekt erlaubt keine Forks oder Pull Requests
- **Nur Issues**: Bitte verwende ausschließlich das Issue-System für Feedback und Meldungen
- **Keine Code-Änderungen**: Externe Code-Änderungen werden nicht akzeptiert

### Code beitragen
Falls du Interesse an einer Zusammenarbeit hast, kontaktiere bitte den Repository-Owner direkt.

## 📄 Lizenz

Dieses Projekt ist proprietär und unterliegt dem Urheberrecht. Alle Rechte vorbehalten.

Siehe [LICENSE.md](./LICENSE.md) für Details.

**Wichtiger Hinweis**: Forks, Pull Requests und Code-Änderungen sind nicht gestattet. Bitte nutze ausschließlich das Issue-System für Feedback und Meldungen.

## 🗄️ Datenbank Management

### Supabase Setup

**Supabase** ist eine PostgreSQL-as-a-Service Lösung. Die Datenbank wird nicht lokal betrieben, sondern in der Cloud gehostet.

#### Erste Schritte

1. **Projekt erstellen**
   - Gehe zu [Supabase](https://supabase.com) und erstelle ein kostenloses Konto
   - Erstelle ein neues Projekt
   - Wähle eine Region (empfohlen: nahe zu deinem Standort)

2. **Connection String kopieren**
   - Gehe zu Project Settings → Database
   - Kopiere die Connection String (URI)
   - Die URL sieht aus wie: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`
   - Setze diese als `DATABASE_URL` in deiner `.env` Datei

3. **Datenbank-Schema**
   - Das Backend erstellt Tabellen automatisch beim ersten Start (via SQLModel)
   - Keine manuellen Migrations nötig

#### Backup & Wiederherstellung

**Supabase bietet automatische Backups:**
- **Free Tier**: Tägliche Backups (7 Tage Aufbewahrung)
- **Pro Tier**: Kontinuierliche Backups mit Point-in-Time Recovery

**Manuelles Backup:**
```bash
# Backup erstellen (von Supabase Dashboard)
# Oder via Supabase CLI:
supabase db dump -f backup.sql
```

**Backup wiederherstellen:**
```bash
# Via Supabase Dashboard
# Oder via Supabase CLI:
supabase db reset --db-url postgresql://...
```

#### Datenbank-Zugriff

**Supabase Dashboard:**
- SQL Editor für direkte Datenbankabfragen
- Table Editor für visuelle Datenverwaltung
- API Docs für automatisch generierte API-Dokumentation

**Externe Tools:**
- Du kannst jeden PostgreSQL-Client verwenden (z.B. pgAdmin, DBeaver)
- Verbinde dich mit der Connection String aus Supabase

## 🐛 Bekannte Probleme / Roadmap

- [x] Migration zu Vite + React Router
- [x] Migration zu Python/FastAPI Backend
- [x] Supabase Integration
- [x] DSGVO-konforme Verschlüsselung sensibler Daten
- [x] Refresh Tokens & KI-Kontingente
- [ ] Mobile UI & Offline-Modus
- [ ] Admin Dashboard für Quoten-/User-Management

## 📚 Weitere Dokumentation

- [CHANGELOG.md](./CHANGELOG.md) - Vollständige Release Notes und Änderungsprotokoll
- [API Keys Setup](./API_KEYS_SETUP.md)
- [Admin Account Setup](./ADMIN_ACCOUNT.md)
- [Environment Setup](./ENV_SETUP.md)
