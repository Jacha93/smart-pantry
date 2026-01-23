# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [1.0.0] - 2025-01-XX

### 🚀 Major Release: Tech-Stack Migration

Dieses Release markiert den vollständigen Tech-Stack-Wechsel des Smart Pantry Projekts zu einem modernen, produktionsreifen Tech-Stack. Der gesamte Code wurde migriert und optimiert für bessere Performance, Wartbarkeit und Skalierbarkeit.

### ✨ Backend-Migration

#### Von Express.js/Node.js zu FastAPI/Python 3.13

- **Vollständige Neuimplementierung** des Backends von Express.js/Node.js zu FastAPI/Python 3.13
- **ORM-Wechsel**: Migration von Prisma (Node.js) zu SQLModel (Python, SQLAlchemy-basiert)
- **Async/Await Patterns**: Vollständige asynchrone Programmierung für bessere Performance
- **Automatische API-Dokumentation**: OpenAPI/Swagger Dokumentation out-of-the-box
- **Python Type Hints**: Vollständige Type-Safety durch Python Type Hints
- **Pydantic Models**: Automatische Datenvalidierung und Serialisierung
- **uvicorn ASGI Server**: Asynchroner Web-Server für optimale Performance

#### Technische Verbesserungen

- **Async Database Operations**: asyncpg für asynchrone PostgreSQL-Verbindungen
- **JWT + Refresh Token Authentication**: python-jose für Token-Generierung, passlib[bcrypt] für Passwort-Hashing
- **AES-256-GCM Verschlüsselung**: DSGVO-konforme Verschlüsselung sensibler Profildaten
- **File Upload**: python-multipart für sichere File-Uploads
- **Error Handling**: Strukturierte Fehlerbehandlung mit FastAPI Middleware
- **Security Headers**: Automatische Security Headers via Middleware

### 🎨 Frontend-Migration

#### Von Legacy Build-System zu Vite 6.x

- **Build-System**: Migration zu Vite 6.x (von Webpack/CRA)
- **React Upgrade**: Upgrade auf React 19.x mit neuen Features und Optimierungen
- **React Router**: Migration zu React Router 7 mit modernen Routing-Features
- **TypeScript**: TypeScript 5.1+ mit strikter Type-Safety
- **TailwindCSS 4**: Modernes Utility-First CSS Framework
- **Optimierte Production-Builds**: Tree-Shaking, Code-Splitting, optimierte Bundle-Größe

#### Performance-Verbesserungen

- **HMR (Hot Module Replacement)**: Sofortige Updates im Development-Modus
- **Extrem schnelle Dev-Server**: Vite's optimierte Development-Experience
- **Optimierte Production-Builds**: Minimale Bundle-Größe durch Tree-Shaking
- **Code-Splitting**: Automatische Code-Aufteilung für bessere Ladezeiten

### 🏗️ Infrastruktur & DevOps

#### Docker & Containerisierung

- **Multi-Stage Docker Builds**: Optimierte Docker Images mit separaten Build- und Runtime-Stages
- **Einzelnes Image**: Frontend + Backend im selben Container für vereinfachtes Deployment
- **Nginx Reverse Proxy**: Nginx serviert Frontend-Dateien und proxied API-Requests zum Backend
- **Optimierte Image-Größe**: Minimale Production-Images durch Multi-Stage Builds

#### CI/CD & Deployment

- **GitHub Actions**: Automatische Builds und Docker Image Publishing
- **GitHub Container Registry**: Docker Images werden automatisch zu ghcr.io gepusht
- **Semantic Release**: Automatische Versionierung basierend auf Commit-Messages
- **Branch-basierte Tags**: Automatische Image-Tags für main, dev und agent Branches

#### Datenbank

- **Supabase Integration**: PostgreSQL as a Service statt lokaler Datenbank
- **Alembic Migrations**: Strukturierte Datenbank-Migrations
- **Connection String Management**: Vereinfachtes Deployment ohne lokale DB-Verwaltung

### 🔒 Sicherheit

- **DSGVO-konforme Verschlüsselung**: AES-256-GCM für sensible Profildaten
- **Sichere Passwort-Speicherung**: passlib[bcrypt] mit 10 Runden
- **JWT + Refresh Tokens**: Sichere Session-Verwaltung mit Token-Rotation
- **CORS Middleware**: Konfigurierbare Cross-Origin Resource Sharing
- **Security Headers**: Automatische Security Headers (X-Content-Type-Options, X-Frame-Options, etc.)
- **Input Validation**: Pydantic Models für automatische Validierung aller API-Inputs

### 📊 Technische Metriken

- **Backend-Code**: ~3.000+ Zeilen Python-Code
- **Frontend-Code**: 61 TypeScript/TSX-Dateien
- **API-Endpoints**: 20+ REST-Endpoints
- **Datenbank-Tabellen**: 7 Haupttabellen mit vollständigen Beziehungen
- **React-Komponenten**: 41 Komponenten (inkl. 13 shadcn/ui Komponenten)

### 🔄 Breaking Changes

#### Backend

- **API-Endpoints bleiben kompatibel**: REST-Endpoints bleiben unverändert, keine Breaking Changes für API-Consumer
- **Umgebungsvariablen**: Teilweise angepasste Umgebungsvariablen (siehe Migration Guide)

#### Frontend

- **Build-Prozess geändert**: Vite statt Webpack/CRA
- **Umgebungsvariablen**: VITE_* Prefix für alle Frontend-Umgebungsvariablen
- **Development-Server**: Port 5173 statt 3000 (konfigurierbar)

#### Docker

- **Image-Struktur geändert**: Multi-Stage Builds mit optimierter Struktur
- **Container-Ports**: Frontend auf Port 3000, Backend auf Port 3001 (intern)
- **Nginx als Reverse Proxy**: API-Requests werden über `/api` Path proxied

### 📝 Migration Guide

#### Für Entwickler

1. **Backend-Setup**:
   - Python 3.13+ erforderlich
   - `pip install -r backend_python/requirements.txt`
   - Umgebungsvariablen in `backend_python/.env` setzen

2. **Frontend-Setup**:
   - Node.js 20+ erforderlich
   - `npm install`
   - Umgebungsvariablen in `.env` setzen (VITE_* Prefix)

3. **Docker Setup**:
   - Docker Compose Setup bleibt kompatibel
   - Image wird automatisch von GitHub Container Registry gepullt
   - Umgebungsvariablen in `.env` setzen

#### Für API-Consumer

- **Keine Breaking Changes**: Alle API-Endpoints bleiben kompatibel
- **OpenAPI-Dokumentation**: Verfügbar unter `/docs` (Swagger UI) und `/redoc` (ReDoc)

### 🎯 Nächste Schritte

- [ ] Mobile UI & Offline-Modus
- [ ] Admin Dashboard für Quoten-/User-Management
- [ ] Erweiterte Analytics
- [ ] Push-Benachrichtigungen
- [ ] Social Features (Rezepte teilen)

### 📚 Weitere Informationen

- Siehe [README.md](./README.md) für Setup-Anweisungen
- Siehe [PRESENTATION_PROJECT_INFO.md](./PRESENTATION_PROJECT_INFO.md) für detaillierte Projektinformationen
- Siehe [API_KEYS_SETUP.md](./API_KEYS_SETUP.md) für API-Key-Konfiguration

---

## [0.0.5] - Vorherige Version

### Features

- Lebensmittel-Inventarverwaltung
- KI-gestützte Foto-Analyse mit Google Gemini
- Intelligente Rezeptvorschläge
- Einkaufslisten-Management
- Rezept-Management
- Chat-Interface
- Mehrsprachigkeit (Deutsch/Englisch)
- Quoten- & Limit-System

[1.0.0]: https://github.com/Jacha93/smart-pantry/releases/tag/v1.0.0
[0.0.5]: https://github.com/Jacha93/smart-pantry/releases/tag/v0.0.5
