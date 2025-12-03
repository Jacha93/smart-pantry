# Ad-Integration Guide für Smart Pantry

## Übersicht

Die App unterstützt jetzt Ad-Blocks für Free Tier User. Die Ads werden automatisch nur für Free Tier User angezeigt, während Basic und Pro User eine werbefreie Erfahrung haben.

## Komponenten

### 1. `AdBlock` Komponente (`src/components/ad-block.tsx`)

Die Hauptkomponente für die Anzeige von Werbung.

**Features:**
- Unterstützt Google AdSense
- Zeigt Placeholder im Dev-Mode
- Automatische Plan-Erkennung (nur Free Tier)
- Responsive Ad-Formate

**Verwendung:**
```tsx
import { AdBlock } from '@/components/ad-block';
import { useUserPlan } from '@/hooks/use-user-plan';

function MyComponent() {
  const { plan } = useUserPlan();
  
  return (
    <AdBlock 
      format="rectangle" 
      currentPlan={plan}
      devMode={process.env.NODE_ENV === 'development'}
    />
  );
}
```

**Props:**
- `adSlotId` (optional): Google AdSense Ad-Slot ID (z.B. '1234567890-1')
- `format`: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
- `responsive`: boolean (default: true)
- `currentPlan`: 'free' | 'basic' | 'pro'
- `devMode`: boolean - Zeige Ads auch für Paid User (für Testing)

## Google AdSense Setup

### Schritt 1: AdSense Account erstellen

1. Gehe zu https://www.google.com/adsense/
2. Erstelle einen Account oder melde dich an
3. Füge deine Website hinzu: `https://deine-domain.com`
4. Verifiziere deine Website (via HTML-Tag oder DNS)

### Schritt 2: Ad Units erstellen

1. Gehe zu "Ads" → "By ad unit"
2. Erstelle verschiedene Ad Units:
   - **Rectangle Ad** (300x250): Für Seitenleisten und zwischen Content
   - **Horizontal Banner** (728x90): Für oberen/unteren Bereich
   - **Vertical Banner** (160x600): Für Sidebar
   - **Auto Ad**: Responsive, passt sich automatisch an

3. Kopiere die **Ad Unit ID** (Format: `ca-pub-XXXXXXXXXX-YYYYYYYYYY`)

### Schritt 3: AdSense Script einbinden

Füge das AdSense Script in `src/app/layout.tsx` ein:

```tsx
// In layout.tsx, im <head> Bereich:
<script
  async
  src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
  crossOrigin="anonymous"
/>
```

### Schritt 4: Environment Variables

Füge in `.env` hinzu:

```env
# Google AdSense
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=deine-publisher-id
NEXT_PUBLIC_ADSENSE_AD_SLOT_RECTANGLE=deine-rectangle-slot-id
NEXT_PUBLIC_ADSENSE_AD_SLOT_HORIZONTAL=deine-horizontal-slot-id
NEXT_PUBLIC_ADSENSE_AD_SLOT_VERTICAL=deine-vertical-slot-id

# Dev-Mode: Zeige Ads für alle User (für Testing)
NEXT_PUBLIC_SHOW_ADS_FOR_ALL=false
```

### Schritt 5: AdBlock Komponente mit AdSense verwenden

```tsx
<AdBlock 
  adSlotId={process.env.NEXT_PUBLIC_ADSENSE_AD_SLOT_RECTANGLE}
  format="rectangle" 
  currentPlan={plan}
/>
```

## Aktuelle Ad-Platzierungen

### 1. Groceries Page (`/groceries`)
- **Position**: Am Ende der Seite, nach der Grocery Table
- **Format**: Rectangle (300x250)
- **Nur Free Tier**: ✅

### 2. Recipes Page (`/recipes`)
- **Position**: Am Ende der Seite, nach allen Rezepten
- **Format**: Horizontal Banner (728x90)
- **Nur Free Tier**: ✅

### 3. Shopping List Page (`/shopping-list`)
- **Position**: Am Ende der Seite, nach allen Shopping Lists
- **Format**: Rectangle (300x250)
- **Nur Free Tier**: ✅

### 4. Recipe Suggestions Grid (Fridge Analyzer)
- **Position**: Nach dem ersten Rezept (Free Tier) und nach mehreren Rezepten
- **Format**: Rectangle (300x250) und Horizontal Banner (728x90)
- **Nur Free Tier**: ✅

## Dev-Mode für Testing

Um Ads auch für Paid User zu sehen (für Testing):

1. **Option 1**: Environment Variable setzen
   ```env
   NEXT_PUBLIC_SHOW_ADS_FOR_ALL=true
   ```

2. **Option 2**: Dev-Mode Prop verwenden
   ```tsx
   <AdBlock 
     format="rectangle" 
     currentPlan={plan}
     devMode={true}
   />
   ```

3. **Option 3**: Im Development-Mode automatisch aktiv
   - Ads werden automatisch angezeigt wenn `NODE_ENV === 'development'`

## Plan-Erkennung

Die Plan-Erkennung erfolgt automatisch über den `useUserPlan` Hook:

```tsx
import { useUserPlan } from '@/hooks/use-user-plan';

const { plan, isLoading } = useUserPlan();
// plan: 'free' | 'basic' | 'pro'
```

**Plan-Logik:**
- **Pro**: `quotas.hasPrioritySupport === true`
- **Basic**: `maxCacheRecipeSuggestions === 30 && maxChatMessages === 16`
- **Free**: Alles andere

## Best Practices

1. **Nicht zu viele Ads**: Maximal 2-3 Ads pro Seite
2. **Strategische Platzierung**: Ads sollten nicht den Content-Flow stören
3. **Responsive Design**: Verwende 'auto' Format für mobile Geräte
4. **Performance**: Ads werden lazy-loaded, um die Performance nicht zu beeinträchtigen
5. **User Experience**: Ads sind dezent und stören nicht die Nutzung

## Troubleshooting

### Ads werden nicht angezeigt

1. **Prüfe Plan**: Stelle sicher, dass User Free Tier ist
2. **Prüfe AdSense**: Ist der Account aktiviert und verifiziert?
3. **Prüfe Ad-Slot ID**: Ist die ID korrekt?
4. **Prüfe Browser Console**: Gibt es Fehler beim Laden?
5. **AdBlocker**: Deaktiviere AdBlocker für Testing

### Ads werden für Paid User angezeigt

1. Prüfe `devMode` Prop
2. Prüfe `NEXT_PUBLIC_SHOW_ADS_FOR_ALL` Environment Variable
3. Prüfe `NODE_ENV` (Development-Mode zeigt Ads für alle)

### AdSense Script lädt nicht

1. Prüfe Publisher ID in Environment Variables
2. Prüfe CORS-Einstellungen
3. Prüfe Browser Console für Fehler
4. Stelle sicher, dass Website in AdSense verifiziert ist

## Monetarisierung

### Erwartete Einnahmen (Rough Estimate)

- **CPC (Cost Per Click)**: €0.10 - €1.00 pro Klick
- **CPM (Cost Per Mille)**: €0.50 - €5.00 pro 1000 Impressionen
- **Typische CTR**: 0.5% - 2%

**Beispiel-Berechnung:**
- 1000 Free Tier User pro Monat
- 10.000 Seitenaufrufe pro Monat
- 2 Ads pro Seite = 20.000 Ad-Impressionen
- Bei €2 CPM = €40 pro Monat

**WICHTIG**: Dies sind nur Schätzungen. Tatsächliche Einnahmen hängen von vielen Faktoren ab (Traffic, Nische, Geographie, etc.)

## Nächste Schritte

1. ✅ AdBlock Komponente erstellt
2. ✅ Ad-Platzierungen implementiert
3. ✅ Plan-Erkennung implementiert
4. ⏳ Google AdSense Account erstellen
5. ⏳ Ad Units erstellen
6. ⏳ AdSense Script einbinden
7. ⏳ Environment Variables setzen
8. ⏳ Testing mit echten Ads
9. ⏳ Monitoring & Optimierung

## Support

Bei Fragen oder Problemen:
- Google AdSense Support: https://support.google.com/adsense
- AdSense Policies: https://support.google.com/adsense/answer/48182

