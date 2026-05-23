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
   python3 -m pip install -r requirements.txt
   cd ..
   ```

4. **Supabase Setup**
   - Erstelle ein Projekt auf [Supabase](https://supabase.com)
   - Kopiere die Session Pooler Connection String (DATABASE_URL) aus den Project Settings
   - Die URL sieht aus wie: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-[POOLER_REGION].pooler.supabase.com:5432/postgres`

5. **Backend-Umgebungsvariablen setzen (`backend_python/.env`)**
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-[POOLER_REGION].pooler.supabase.com:5432/postgres
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
   python3 -m uvicorn app.main:app --reload --port 3001

   # Terminal 2: Frontend
   npm run dev
   ```

   - Frontend: http://localhost:5173 (Vite Dev Server)
   - Backend: http://localhost:3001

Für echte lokale End-to-End-Tests mit Supabase, Backend und mehreren Testusern siehe [docs/local-testing.md](./docs/local-testing.md).

Die geplante Trennung von Marketing, Web-App und API ist in [docs/adr/0001-monorepo-split-domain-strategy.md](./docs/adr/0001-monorepo-split-domain-strategy.md) dokumentiert. Der aktuelle Issue-Fahrplan steht in [docs/issue-roadmap.md](./docs/issue-roadmap.md); die SEO-Content-Struktur fuer die spaetere Marketing-App in [docs/content-architecture.md](./docs/content-architecture.md).

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

- **App-Image**: `ghcr.io/jacha93/smart-pantry-app`
- **Marketing-/Landingpage-Image**: `ghcr.io/jacha93/smart-pantry-marketing`

Jedes Image erhält dieselben Branch- und Versions-Tags:

- **Latest**: `ghcr.io/jacha93/smart-pantry-app:latest` und `ghcr.io/jacha93/smart-pantry-marketing:latest` (nur von main)
- **Versioned**: `ghcr.io/jacha93/smart-pantry-app:v1.0.0` und `ghcr.io/jacha93/smart-pantry-marketing:v1.0.0`
- **Dev/Nightly** (von dev branch):
  - `ghcr.io/jacha93/smart-pantry-app:dev` und `ghcr.io/jacha93/smart-pantry-marketing:dev`
  - `ghcr.io/jacha93/smart-pantry-app:nightly` und `ghcr.io/jacha93/smart-pantry-marketing:nightly`
  - `ghcr.io/jacha93/smart-pantry-app:1.0.0-dev` und `ghcr.io/jacha93/smart-pantry-marketing:1.0.0-dev`
  - `ghcr.io/jacha93/smart-pantry-app:1.0.0-nightly` und `ghcr.io/jacha93/smart-pantry-marketing:1.0.0-nightly`
  - `ghcr.io/jacha93/smart-pantry-app:1.0.0-nightly-<sha>` und `ghcr.io/jacha93/smart-pantry-marketing:1.0.0-nightly-<sha>`
- **Pre-Alpha** (von agent branch):
  - `ghcr.io/jacha93/smart-pantry-app:pre-alpha` und `ghcr.io/jacha93/smart-pantry-marketing:pre-alpha`
  - `ghcr.io/jacha93/smart-pantry-app:1.0.0-pre-alpha` und `ghcr.io/jacha93/smart-pantry-marketing:1.0.0-pre-alpha`
  - `ghcr.io/jacha93/smart-pantry-app:1.0.0-pre-alpha-<sha>` und `ghcr.io/jacha93/smart-pantry-marketing:1.0.0-pre-alpha-<sha>`

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

Der Stack läuft dann mit zwei getrennten Containern:
- **Marketing / Landingpage**: `ghcr.io/jacha93/smart-pantry-marketing`
- **App**: `ghcr.io/jacha93/smart-pantry-app`

Die öffentlichen Marketing-Seiten und die private App sind damit getrennte Deployables. Das App-Image enthält weiterhin Frontend und FastAPI-Backend zusammen; die Landingpage ist ein eigenständiges statisches Image.

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
- `MARKETING_PORT` - Host-Port für die Landingpage (Standard: `3000`)
- `APP_PORT` - Host-Port für die App (Standard: `3001`)

**Wichtig**: 
- `JWT_SECRET` sollte mindestens 32 zufällige Zeichen sein
- `DATABASE_URL` muss von Supabase kopiert werden
- Alle Passwörter sollten stark und eindeutig sein
- **Container-Ports sind hardcoded**: Landingpage 3000, App-Frontend 3000, App-Backend 3001
- **Nur `MARKETING_PORT` und `APP_PORT` sind konfigurierbar** für die Host-Ports
- **Die App kommuniziert intern** zwischen Nginx und FastAPI (`/api` → `localhost:3001`)

### Docker Image Struktur

Das Docker Image enthält:
- **Marketing-Image**: Vite Build als statische Site
- **App-Image**: Vite Build plus Python/FastAPI plus Nginx Proxy

**Zwei Images**: Die öffentliche Landingpage und die private App werden getrennt gebaut, veröffentlicht und im Compose-Stack separat gestartet.

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
   - Kopiere die Session Pooler Connection String (URI)
   - Die URL sieht aus wie: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-[POOLER_REGION].pooler.supabase.com:5432/postgres`
   - Setze diese als `DATABASE_URL` in deiner `.env` Datei

3. **Datenbank-Schema**
   - Wende das SQL-Schema aus `database-dumps/smart_pantry_schema.sql` oder die entsprechende Supabase-Migration an
   - Die Tabellen müssen vor dem ersten echten Login vorhanden sein

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
