# Smart Pantry 🥘

Eine intelligente KI-gestützte Lebensmittel-Inventarverwaltung mit automatischer Bildanalyse und Rezeptvorschlägen.

> **⚠️ Disclaimer:** Dieses Projekt ist ein Experiment und wird im Rahmen eines Selbststudiums von einer KI programmiert. Der Code dient Lernzwecken und sollte nicht als Produktionscode betrachtet werden.

## 🚀 Features

- **Lebensmittel-Inventarverwaltung**: Verwalte deine Lebensmittel digital
- **KI-gestützte Foto-Analyse**: Analysiere Kühlschrank-Fotos mit Google Gemini AI
- **Intelligente Rezeptvorschläge**: Bekomme passende Rezepte basierend auf deinen vorhandenen Zutaten
- **Einkaufslisten**: Automatische Generierung von Einkaufslisten
- **Rezept-Management**: Speichere und verwalte Rezepte, die du gekocht hast
- **Mehrsprachig**: Unterstützung für Deutsch und Englisch

## 📋 Technologien

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **KI**: Google Gemini 2.5 Flash (Bildanalyse), Spoonacular API (Rezepte)
- **Container**: Docker-ready

## 🛠️ Installation

### Voraussetzungen

- Node.js 20+
- npm oder yarn
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
cd backend
npm install
cd ..
```

4. **Umgebungsvariablen einrichten**

Erstelle eine `backend/.env` Datei:
```env
PORT=8000
JWT_SECRET=dev_secret_change_me_in_production
GEMINI_API_KEY=dein_gemini_api_key
SPOONACULAR_API_KEY=dein_spoonacular_api_key
```

Siehe [API_KEYS_SETUP.md](./API_KEYS_SETUP.md) für detaillierte Anleitung.

5. **Frontend starten**
```bash
npm run dev
```

6. **Backend starten** (in separatem Terminal)
```bash
cd backend
npm start
```

Die Anwendung läuft dann auf:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## 🐳 Docker

### Build
```bash
docker build -t smart-pantry:latest .
```

### Run
```bash
docker run -p 3000:3000 -p 8000:8000 \
  -e GEMINI_API_KEY=your_key \
  -e SPOONACULAR_API_KEY=your_key \
  -e JWT_SECRET=your_secret \
  smart-pantry:latest
```

## 📦 GitHub Container Registry

Das Projekt wird automatisch bei jedem Push zu `main` oder `dev` als Docker Image gebaut und zu GitHub Container Registry (ghcr.io) gepusht:

- **Latest**: `ghcr.io/jacha93/smart-pantry:latest` (nur von main)
- **Nightly**: `ghcr.io/jacha93/smart-pantry:nightly` (von dev branch)
- **Versioned**: `ghcr.io/jacha93/smart-pantry:v0.0.3` (von Git Tags)

### Image verwenden

```bash
docker pull ghcr.io/jacha93/smart-pantry:latest
docker run -p 3000:3000 -p 8000:8000 \
  -e GEMINI_API_KEY=your_key \
  -e SPOONACULAR_API_KEY=your_key \
  -e JWT_SECRET=your_secret \
  ghcr.io/jacha93/smart-pantry:latest
```

## 🔒 Sicherheit

- **Keine API Keys im Code**: Alle Secrets werden über Umgebungsvariablen bereitgestellt
- **DSGVO-konforme Verschlüsselung**: Vorbereitet für zukünftige Datenbank-Migration
- **JWT-basierte Authentifizierung**: Sichere Token-basierte Authentifizierung

## 📝 Version

Aktuelle Version: **v0.0.3**

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

## 🐛 Bekannte Probleme / Roadmap

- [ ] Migration zu PostgreSQL/MariaDB
- [ ] DSGVO-Verschlüsselung implementieren
- [ ] KI-basierte personalisierte Rezeptvorschläge basierend auf gekochten Rezepten

## 📚 Weitere Dokumentation

- [API Keys Setup](./API_KEYS_SETUP.md)
