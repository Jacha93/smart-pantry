# Smart Pantry 🥘

Eine intelligente KI-gestützte Lebensmittel-Inventarverwaltung mit automatischer Bildanalyse und Rezeptvorschlägen.

> **⚠️ Disclaimer:** Dieses Projekt ist ein Experiment und wird im Rahmen eines Selbststudiums von einer KI programmiert. Der Code dient Lernzwecken und sollte nicht als Produktionscode betrachtet werden.

## 🚀 Features

- **Lebensmittel-Inventarverwaltung**: Verwalte dein Vorratslager zentral
- **KI-gestützte Foto-Analyse**: Analysiere Kühlschrank-Fotos mit Google Gemini AI
- **Intelligente Rezeptvorschläge**: Passende Rezepte basierend auf verfügbaren Zutaten
- **Einkaufslisten & Aufgaben**: Generiere automatisch Einkaufslisten
- **Rezept-Management**: Speichere eigene oder AI-generierte Rezepte
- **Refresh Tokens & Quoten**: Sichere Sessions + konfigurierbare KI- und API-Kontingente
- **Mehrsprachig**: Unterstützung für Deutsch und Englisch

## 📋 Technologien

- **Frontend**: Next.js 16, React 19.2, TypeScript 5.1+, Tailwind CSS
- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL
- **KI**: Google Gemini 2.5 Flash (Bildanalyse), Spoonacular API (Rezepte)
- **Container**: Docker Compose (Postgres + Backend/Frontend)
- **Bundler**: Turbopack (Standard in Next.js 16)

## 🛠️ Installation

### Voraussetzungen

- Node.js 20+
- npm oder yarn
- **Docker & Docker Compose** (für lokale PostgreSQL-Instanz)
- Google Gemini API Key (optional, für Bildanalyse)
- Spoonacular API Key (optional, für Rezepte)

### Lokale Entwicklung

1. **Repository klonen**
   ```bash
   git clone https://github.com/Jacha93/smart-pantry.git
   cd smart-pantry
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **PostgreSQL starten**
   ```bash
   docker compose up -d smart-pantry-postgres
   ```

4. **Backend-Umgebungsvariablen setzen (`backend/.env`)**
   ```env
   PORT=8000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smart_pantry?schema=public
   PERSONAL_DATA_KEY=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff  # 32 Byte Hex
   JWT_SECRET=dev_secret_change_me_in_production
   REFRESH_TOKEN_TTL_MS=2592000000
   QUOTA_RESET_INTERVAL_MS=2592000000
   LLM_TOKEN_COST_CHAT=500
   LLM_TOKEN_COST_TRANSLATION=200
   LLM_TOKEN_COST_ANALYZE=1500
   RECIPE_CALL_COST_ANALYZE=1
   GEMINI_API_KEY=dein_gemini_api_key
   SPOONACULAR_API_KEY=dein_spoonacular_api_key
   ```

5. **Frontend-Umgebungsvariablen (`.env.local`)**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_AUTH_DISABLED=false
   ```

6. **Prisma Migrations ausführen**
   ```bash
   cd backend
   npm run prisma:migrate
   npm run prisma:generate
   cd ..
   ```

7. **Backend & Frontend starten**
   ```bash
   # Terminal 1
   cd backend
   npm run dev

   # Terminal 2
   npm run dev
   ```

   - Frontend: http://localhost:3000  
   - Backend: http://localhost:8000  

## 🔓 Demo-Modus (Login deaktivieren)

Für Präsentationen ist der Login im Entwicklungsmodus automatisch deaktiviert. Das Backend nutzt einen Demo-User (`demo@smartpantry.app`) und das Frontend lässt den Zugriff ohne Token zu.

- **Standard-Credentials (falls Login trotzdem genutzt wird):**  
  `demo@smartpantry.app` / `demo123`
- **Demo-Modus erzwingen (z. B. Produktion):**
  - Backend: `AUTH_DISABLED=true`
  - Frontend: `NEXT_PUBLIC_AUTH_DISABLED=true`
- **Login wieder aktivieren:** Setze beide Variablen explizit auf `false`.

## 🐳 Docker & Homelab Deployment

### Production Deployment mit Docker Compose

Das Projekt wird automatisch bei jedem Push zu `main`, `dev` oder `agent` als Docker Image gebaut und zu GitHub Container Registry (ghcr.io) gepusht:

- **Latest**: `ghcr.io/jacha93/smart-pantry:latest` (nur von main)
- **Versioned**: `ghcr.io/jacha93/smart-pantry:v0.0.5` (Semantic Versioning via Semantic Release)
- **Nightly**: `ghcr.io/jacha93/smart-pantry:nightly` (von dev branch)
- **Dev**: `ghcr.io/jacha93/smart-pantry:dev` (von dev branch)
- **Pre-Alpha**: `ghcr.io/jacha93/smart-pantry:pre-alpha` (von agent branch)

**Versionierung**: Die Version wird automatisch durch [Semantic Release](https://github.com/semantic-release/semantic-release) basierend auf Commit-Messages berechnet:
- `feat:` → Minor Version (v0.0.5 → v0.1.0)
- `fix:` → Patch Version (v0.0.5 → v0.0.6)
- `BREAKING CHANGE:` → Major Version (v0.0.5 → v1.0.0) - **Hinweis**: v1.0.0 wird erst mit der Mobile App veröffentlicht

#### Schnellstart für Homelab

1. **Repository klonen**
   ```bash
   git clone https://github.com/Jacha93/smart-pantry.git
   cd smart-pantry
   ```

2. **Umgebungsvariablen einrichten**
   ```bash
   cp .env.example .env
   # Bearbeite .env und fülle alle Werte aus (siehe unten)
   ```

3. **Docker Compose starten**
   ```bash
   # Production (Standard - wird automatisch erkannt)
   docker compose up -d
   ```
   
   **Hinweis**: Beim ersten Start kann es 1-2 Minuten dauern, bis das Image von GitHub Container Registry gepullt wurde.

4. **Prisma Migrations ausführen** (einmalig nach erstem Start)
   ```bash
   docker compose exec app npx prisma migrate deploy
   ```
   
   **Was macht das?** Diese Migration erstellt alle Datenbank-Tabellen (User, Grocery, Recipes, etc.) in deiner PostgreSQL-Datenbank. Beim ersten Start ist die Datenbank leer - die Migration richtet die komplette Struktur ein.

Die App läuft dann auf:
- **Frontend**: http://localhost:3000 (oder dein konfigurierter Port)
- **Backend**: http://localhost:8000
- **PostgreSQL**: localhost:5432

#### Umgebungsvariablen konfigurieren

Die `.env.example` Datei enthält alle benötigten Variablen mit Beschreibungen:

- **Datenbank**: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- **Security**: `JWT_SECRET`, `PERSONAL_DATA_KEY` (64 Hex-Zeichen)
- **API Keys**: `GEMINI_API_KEY`, `SPOONACULAR_API_KEY`, `GITHUB_TOKEN` (optional)
- **Quoten**: `LLM_TOKEN_COST_*`, `RECIPE_CALL_COST_*`
- **Frontend**: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_AUTH_DISABLED`

**Wichtig**: 
- `PERSONAL_DATA_KEY` generieren mit: `openssl rand -hex 32`
- `JWT_SECRET` sollte mindestens 32 zufällige Zeichen sein
- Alle Passwörter sollten stark und eindeutig sein

### Lokale Entwicklung

Für lokale Entwicklung nutze die `compose.dev.yml` (nur PostgreSQL) und starte Backend/Frontend manuell:

```bash
# PostgreSQL starten
docker compose -f compose.dev.yml up -d smart-pantry-postgres

# Backend & Frontend lokal starten (siehe Installation oben)
```

## 🔒 Sicherheit

- **Keine API Keys im Code**: Alle Secrets werden über Umgebungsvariablen bereitgestellt
- **AES-256 Verschlüsselung**: Kundenprofile (Adressen etc.) werden mit `PERSONAL_DATA_KEY` sicher verschlüsselt
- **JWT + Refresh Tokens**: Kurzlebige Access Tokens, Refresh Tokens in PostgreSQL widerrufbar
- **Quoten & Limits**: KI- und API-Aufrufe werden pro Nutzer protokolliert und limitiert

## 📝 Version

Aktuelle Version: **v0.0.5**

> **Hinweis**: Version v1.0.0 wird erst mit der Implementierung der Mobile App veröffentlicht.

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

### Prisma Migrations - Was ist das?

**Prisma Migrations** sind SQL-Skripte, die deine Datenbank-Struktur erstellen und aktualisieren.

#### Wann werden Migrations benötigt?

1. **Beim ersten Start** (einmalig):
   - Die Datenbank ist leer
   - Migration erstellt alle Tabellen (User, Grocery, Recipes, etc.)
   - Ohne Migration funktioniert die App nicht (Tabellen fehlen)

2. **Bei Schema-Änderungen** (nach Code-Updates):
   - Wenn neue Tabellen/Spalten hinzugefügt werden
   - Wenn das `prisma/schema.prisma` geändert wurde
   - Migration passt die Datenbank-Struktur an

#### Migration ausführen

**Production (nach jedem Update):**
```bash
docker compose exec app npx prisma migrate deploy
```

**Development (erstellt neue Migration):**
```bash
cd backend
npm run prisma:migrate
```

**Wichtig**: 
- `migrate deploy` = Führt vorhandene Migrations aus (Production)
- `migrate dev` = Erstellt neue Migration + führt aus (Development)

#### ⚠️ Werden meine Daten gelöscht?

**NEIN - Deine Daten sind sicher!** 

Prisma Migrations sind **idempotent** und **inkrementell**:

1. **Migration-Tracking**: Prisma speichert in der Tabelle `_prisma_migrations`, welche Migrations bereits ausgeführt wurden
2. **Nur neue Migrations**: `migrate deploy` führt **nur ausstehende** Migrations aus, nicht bereits ausgeführte
3. **Daten bleiben erhalten**: Bestehende Daten werden **NICHT gelöscht** oder überschrieben
4. **Inkrementelle Änderungen**: Neue Migrations fügen nur Änderungen hinzu (z.B. neue Spalte, neue Tabelle)

**Beispiel:**
```bash
# Beim ersten Start
docker compose exec app npx prisma migrate deploy
# → Führt Migration 0001_init aus (erstellt alle Tabellen)

# Später, nach Code-Update mit neuer Migration
docker compose exec app npx prisma migrate deploy
# → Führt NUR die neue Migration aus (z.B. 0002_add_notifications)
# → Bestehende Daten bleiben unverändert!
```

**Ausnahme - Potenzielle Risiken:**
- ❌ `DROP TABLE` - würde Tabelle löschen (wird aber normalerweise nicht automatisch generiert)
- ❌ `ALTER COLUMN` mit Datenverlust (z.B. Spalte entfernen) - Prisma warnt davor
- ✅ `ADD COLUMN` - sicher, bestehende Daten bleiben erhalten
- ✅ `CREATE TABLE` - sicher, erstellt nur neue Tabellen
- ✅ `ALTER TABLE ADD CONSTRAINT` - sicher, fügt nur Constraints hinzu

**Best Practice**: Vor wichtigen Updates immer ein Backup erstellen (siehe Backup-Sektion unten)!

### Datenbank Backup

#### Automatisches Backup (empfohlen)

Erstelle ein Backup-Skript `backup-db.sh`:

```bash
#!/bin/bash
# Backup-Skript für Smart Pantry Datenbank

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/smart_pantry_backup_$TIMESTAMP.sql"

# Erstelle Backup-Verzeichnis
mkdir -p $BACKUP_DIR

# Backup erstellen
docker compose exec -T smart-pantry-postgres pg_dump -U postgres smart_pantry > $BACKUP_FILE

# Komprimieren (optional)
gzip $BACKUP_FILE

echo "✅ Backup erstellt: ${BACKUP_FILE}.gz"
```

**Cron-Job für tägliche Backups:**
```bash
# Füge zu crontab hinzu: crontab -e
0 2 * * * /path/to/smart-pantry/backup-db.sh
```

#### Manuelles Backup

```bash
# Backup erstellen
docker compose exec smart-pantry-postgres pg_dump -U postgres smart_pantry > backup.sql

# Backup wiederherstellen
docker compose exec -T smart-pantry-postgres psql -U postgres smart_pantry < backup.sql
```

#### Backup wiederherstellen

```bash
# 1. Stoppe die App
docker compose down

# 2. Stelle Backup wieder her
docker compose exec -T smart-pantry-postgres psql -U postgres smart_pantry < backup.sql

# 3. Starte die App neu
docker compose up -d
```

### Datenbank-Volumes

Die Datenbank-Daten werden in einem Docker Volume gespeichert:
- **Volume-Name**: `postgres-data`
- **Speicherort**: Docker verwaltet automatisch (normalerweise `/var/lib/docker/volumes/`)

**Volume sichern:**
```bash
# Volume exportieren
docker run --rm -v smart-pantry_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data-backup.tar.gz /data

# Volume wiederherstellen
docker run --rm -v smart-pantry_postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-data-backup.tar.gz -C /
```

## 🐛 Bekannte Probleme / Roadmap

- [x] Migration zu PostgreSQL + Prisma
- [x] DSGVO-konforme Verschlüsselung sensibler Daten
- [x] Refresh Tokens & KI-Kontingente
- [ ] Mobile UI & Offline-Modus
- [ ] Admin Dashboard für Quoten-/User-Management

## 📚 Weitere Dokumentation

- [API Keys Setup](./API_KEYS_SETUP.md)
