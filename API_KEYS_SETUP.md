# API Keys Setup - Anleitung

## Übersicht

Dieses Projekt verwendet zwei externe APIs für die Foto-Analyse und Rezeptvorschläge:

1. **Google Gemini API** - Für die Bildanalyse (Erkennung von Lebensmitteln)
2. **Spoonacular Recipe API** - Für Rezeptvorschläge basierend auf erkannten Lebensmitteln

## Schritt 1: Google Gemini API Key (für Bildanalyse)

### ⚠️ WICHTIG: Woher bekomme ich den API Key?

Der API Key kommt von **Google AI Studio** (nicht Google Cloud Console):

1. Gehe zu **Google AI Studio**: https://aistudio.google.com/apikey
2. Melde dich mit deinem Google-Konto an
3. Klicke auf **"Create API Key"** (oben rechts oder im Dashboard)
4. Wähle ein Google Cloud Projekt aus (oder erstelle ein neues)
5. **Kopiere den generierten API Key** (z.B. `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### ✅ Wo muss ich den API Key einfügen?

**KLARE ANLEITUNG:**

**Option A: Umgebungsvariable (Empfohlen für Production)**
```bash
# Im Backend-Verzeichnis
cd backend
export GEMINI_API_KEY="dein_api_key_hier"
npm start
```

**Option B: .env Datei (Empfohlen für Development) - ⭐ EMPFOHLEN**
```bash
# Im Backend-Verzeichnis eine .env Datei erstellen:
cd backend

# Erstelle die .env Datei (falls nicht vorhanden)
touch .env

# Öffne die .env Datei mit einem Editor und füge ein:
# GEMINI_API_KEY=dein_api_key_von_google_ai_studio_hier
# SPOONACULAR_API_KEY=dein_spoonacular_key_hier
# JWT_SECRET=dev_secret_change_me_in_production
# PORT=8000

# Beispiel .env Inhalt:
# GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# SPOONACULAR_API_KEY=1234567890abcdef1234567890abcdef
# JWT_SECRET=dev_secret_change_me_in_production
# PORT=8000

npm start
```

**Wichtig:** Der `GEMINI_API_KEY` muss von **Google AI Studio** kommen (https://aistudio.google.com/apikey), nicht von der Google Cloud Console!

**Option C: Direkt in server.js (NUR für Tests, NICHT empfohlen)**
```javascript
// backend/server.js
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'DEIN_API_KEY_HIER';
```
⚠️ **WARNUNG**: Füge den API Key niemals direkt in den Code ein, wenn du das Projekt committen willst!

### Verwendung

Der API Key wird im Backend automatisch geladen, wenn er als Umgebungsvariable gesetzt ist:
```javascript
// backend/server.js
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
```

Falls kein Key gesetzt ist, verwendet das System automatisch Stub-Daten (Demo-Daten).

---

## Schritt 2: Spoonacular Recipe API Key

### Woher bekomme ich den API Key?

1. Gehe zu **Spoonacular Food API**: https://spoonacular.com/food-api
2. Klicke auf **"Get API Key"** oder **"Sign Up"**
3. Erstelle ein kostenloses Konto
4. Gehe zu **"My Console"** → **"API Keys"**
5. Kopiere deinen API Key

**Kostenloses Limit:**
- 150 Requests pro Tag (kostenlos)
- Für mehr Requests gibt es kostenpflichtige Pläne

### Wo muss ich den API Key einfügen?

**Option A: Umgebungsvariable (Empfohlen für Production)**
```bash
cd backend
export SPOONACULAR_API_KEY="dein_api_key_hier"
npm start
```

**Option B: .env Datei (Empfohlen für Development)**
```bash
cd backend
echo "SPOONACULAR_API_KEY=dein_api_key_hier" >> .env
npm start
```

### Verwendung

Der API Key wird im Backend automatisch geladen:
```javascript
// backend/server.js
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || '';
```

Falls kein Key gesetzt ist, verwendet das System automatisch Stub-Daten.

---

## Komplettes Setup-Beispiel

### 1. Erstelle eine .env Datei im Backend-Verzeichnis:

```bash
cd "/mnt/coding_hdd/Coding Projekte/GitClone/AI-Inventory/backend"
touch .env
```

### 2. Füge deine API Keys hinzu:

```bash
# Öffne die .env Datei und füge folgende Zeilen ein:
GEMINI_API_KEY=dein_gemini_api_key_hier
SPOONACULAR_API_KEY=dein_spoonacular_api_key_hier
JWT_SECRET=dev_secret_change_me_in_production
PORT=8000
```

### 3. Installiere dotenv (falls noch nicht vorhanden):

```bash
cd backend
npm install dotenv
```

### 4. Lade .env in server.js:

Füge am Anfang von `backend/server.js` hinzu:
```javascript
require('dotenv').config();
```

Oder starte den Server mit:
```bash
node -r dotenv/config server.js
```

### 5. Starte das Backend:

```bash
npm start
```

---

## Sicherheitshinweise

### ✅ DO's:
- ✅ Verwende `.env` Dateien für lokale Entwicklung
- ✅ Füge `.env` zu `.gitignore` hinzu (wird nicht committet)
- ✅ Verwende Umgebungsvariablen in Production (z.B. Heroku, AWS, Docker)
- ✅ Rotiere API Keys regelmäßig

### ❌ DON'Ts:
- ❌ Committe niemals API Keys in Git
- ❌ Teile API Keys nicht öffentlich
- ❌ Hardcode API Keys nicht im Code
- ❌ Speichere API Keys nicht in Frontend-Code

---

## Verifizierung

### Teste ob die API Keys funktionieren:

1. **Gemini Test:**
   - Lade ein Foto im "Fridge Analyzer" hoch
   - Wenn Lebensmittel erkannt werden (nicht die Stub-Daten), funktioniert Gemini

2. **Spoonacular Test:**
   - Nach erfolgreicher Foto-Analyse sollten echte Rezepte von Spoonacular angezeigt werden
   - Wenn Stub-Rezepte erscheinen, ist der Spoonacular Key nicht gesetzt

### Backend Logs prüfen:

```bash
# Im Backend-Terminal siehst du:
# ✅ "Gemini erkannte Lebensmittel: [Milk, Eggs, ...]" → Gemini funktioniert
# ⚠️  "WARNING: GEMINI_API_KEY nicht gesetzt..." → Key fehlt
```

---

## Troubleshooting

### Problem: "Gemini API Fehler"

**Lösung:**
- Prüfe ob der API Key korrekt in der `.env` Datei steht
- Prüfe ob der API Key noch gültig ist (nicht abgelaufen)
- Prüfe die Google Cloud Console auf Limits/Quotas

### Problem: "Spoonacular API Fehler: 402 Payment Required"

**Lösung:**
- Du hast das kostenlose Tageslimit (150 Requests) erreicht
- Warte bis zum nächsten Tag oder upgrade auf einen kostenpflichtigen Plan

### Problem: API Keys werden nicht geladen

**Lösung:**
- Prüfe ob `dotenv` installiert ist: `npm install dotenv`
- Prüfe ob `require('dotenv').config()` am Anfang von `server.js` steht
- Prüfe ob die `.env` Datei im richtigen Verzeichnis liegt (`backend/.env`)
- Prüfe ob die Umgebungsvariablen korrekt geschrieben sind (keine Anführungszeichen in .env)

---

## Beispiel .env Datei

```env
# Backend Configuration
PORT=8000
JWT_SECRET=dev_secret_change_me_in_production

# Google Gemini API (für Bildanalyse)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Spoonacular Recipe API (für Rezeptvorschläge)
SPOONACULAR_API_KEY=1234567890abcdef1234567890abcdef
```

---

## Nächste Schritte

Nach dem Setup der API Keys:
1. ✅ Backend neu starten
2. ✅ Frontend testen (Foto hochladen im Fridge Analyzer)
3. ✅ Prüfe Backend-Logs auf Erfolgsmeldungen
4. ✅ Teste Rezeptvorschläge

Viel Erfolg! 🚀

