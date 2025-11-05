// Lade Umgebungsvariablen aus .env Datei
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// API Keys (aus Umgebungsvariablen)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || '';

// Initialize Gemini AI (falls API Key vorhanden)
let genAI = null;
console.log('\n🔑 === API-KEY INITIALISIERUNG ===');
console.log('GEMINI_API_KEY vorhanden:', !!GEMINI_API_KEY);
console.log('GEMINI_API_KEY Länge:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);
if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('✅ Gemini AI erfolgreich initialisiert');
  } catch (error) {
    console.error('❌ Fehler bei Gemini AI Initialisierung:', error.message);
  }
} else {
  console.warn('⚠️ WARNING: GEMINI_API_KEY nicht gesetzt. Foto-Analyse verwendet Stub-Daten.');
}
console.log('SPOONACULAR_API_KEY vorhanden:', !!SPOONACULAR_API_KEY);
console.log('SPOONACULAR_API_KEY Länge:', SPOONACULAR_API_KEY ? SPOONACULAR_API_KEY.length : 0);
console.log('================================\n');

app.use(cors());
app.use(express.json());

// In-memory stores (demo)
const users = []; // {id, email, name, passwordHash, created_at}
let nextUserId = 1;

const groceries = []; // {id, user_id, name, quantity, unit, category, expiry_date?, added_date, low_stock_threshold}
let nextGroceryId = 1;

const shoppingLists = []; // {id, user_id, name?, created_at, completed, items: [{id, list_id, grocery_name, quantity, checked}]}
let nextShoppingListId = 1;
let nextShoppingItemId = 1;

// Gekochte Rezepte für KI-Lernen (für zukünftige personalisierte Vorschläge)
const cookedRecipes = []; // {id, user_id, recipe_id, recipe_title, cooked_at, rating?}
let nextCookedRecipeId = 1;

// Gespeicherte Rezeptvorschläge (für Rezepte-Seite)
const savedRecipes = []; // {id, user_id, recipe_id, title, image, used_ingredients, missed_ingredients, likes, sourceUrl, saved_at}
let nextSavedRecipeId = 1;

function generateToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ detail: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

// Auth routes
app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ detail: 'Missing required fields' });
  }
  const exists = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(409).json({ detail: 'User already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: nextUserId++,
    email,
    name,
    passwordHash,
    created_at: new Date().toISOString(),
  };
  users.push(user);
  return res.status(201).json({ id: user.id, email: user.email, name: user.name, created_at: user.created_at });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ detail: 'Missing credentials' });
  const user = users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(401).json({ detail: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ detail: 'Invalid credentials' });
  const access_token = generateToken(user);
  return res.json({ access_token, token_type: 'bearer' });
});

// Groceries routes (protected)
app.get('/groceries', authMiddleware, (req, res) => {
  const list = groceries.filter((g) => g.user_id === req.user.id);
  res.json(list);
});

app.post('/groceries', authMiddleware, (req, res) => {
  const { name, quantity, unit, category, expiry_date, low_stock_threshold } = req.body || {};
  if (!name || quantity == null || !unit || !category || low_stock_threshold == null) {
    return res.status(400).json({ detail: 'Missing fields' });
  }
  const item = {
    id: nextGroceryId++,
    user_id: req.user.id,
    name,
    quantity: Number(quantity),
    unit,
    category,
    expiry_date: expiry_date || undefined,
    added_date: new Date().toISOString(),
    low_stock_threshold: Number(low_stock_threshold),
  };
  groceries.push(item);
  res.status(201).json(item);
});

app.put('/groceries/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const idx = groceries.findIndex((g) => g.id === id && g.user_id === req.user.id);
  if (idx === -1) return res.status(404).json({ detail: 'Not found' });
  const current = groceries[idx];
  const updated = { ...current, ...req.body };
  groceries[idx] = updated;
  res.json(updated);
});

app.delete('/groceries/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const idx = groceries.findIndex((g) => g.id === id && g.user_id === req.user.id);
  if (idx === -1) return res.status(404).json({ detail: 'Not found' });
  groceries.splice(idx, 1);
  res.status(204).end();
});

// Shopping lists (protected)
app.get('/shopping-lists', authMiddleware, (req, res) => {
  const lists = shoppingLists.filter((l) => l.user_id === req.user.id);
  res.json(lists);
});

app.post('/shopping-lists', authMiddleware, (req, res) => {
  const { items, name } = req.body || {};
  const list = {
    id: nextShoppingListId++,
    user_id: req.user.id,
    name: name || undefined,
    created_at: new Date().toISOString(),
    completed: false,
    items: Array.isArray(items)
      ? items.map((it) => ({
          id: nextShoppingItemId++,
          list_id: 0, // will set below
          grocery_name: it.grocery_name,
          quantity: Number(it.quantity) || 1,
          checked: false,
        }))
      : [],
  };
  list.items.forEach((i) => (i.list_id = list.id));
  shoppingLists.push(list);
  res.status(201).json(list);
});

app.post('/shopping-lists/generate', authMiddleware, (req, res) => {
  // very naive: add groceries below low_stock_threshold
  const userGroceries = groceries.filter((g) => g.user_id === req.user.id);
  const need = userGroceries.filter((g) => g.quantity <= g.low_stock_threshold);
  const list = {
    id: nextShoppingListId++,
    user_id: req.user.id,
    created_at: new Date().toISOString(),
    completed: false,
    items: need.map((g) => ({
      id: nextShoppingItemId++,
      list_id: 0,
      grocery_name: g.name,
      quantity: Math.max(1, g.low_stock_threshold + 1 - g.quantity),
      checked: false,
    })),
  };
  list.items.forEach((i) => (i.list_id = list.id));
  shoppingLists.push(list);
  res.status(201).json(list);
});

// DELETE must come before GET :id to avoid route conflicts
app.delete('/shopping-lists/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const idx = shoppingLists.findIndex((l) => l.id === id && l.user_id === req.user.id);
  if (idx === -1) return res.status(404).json({ detail: 'Not found' });
  shoppingLists.splice(idx, 1);
  res.status(204).end();
});

// PUT must come before GET :id to avoid route conflicts
app.put('/shopping-lists/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const list = shoppingLists.find((l) => l.id === id && l.user_id === req.user.id);
  if (!list) return res.status(404).json({ detail: 'List not found' });
  
  const { name } = req.body || {};
  if (name) {
    list.name = String(name);
  }
  res.json(list);
});

// POST /shopping-lists/:id/items must come before GET :id
app.post('/shopping-lists/:id/items', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const list = shoppingLists.find((l) => l.id === id && l.user_id === req.user.id);
  if (!list) return res.status(404).json({ detail: 'List not found' });
  if (list.completed) return res.status(400).json({ detail: 'Cannot add items to completed list' });
  
  const { grocery_name, quantity } = req.body || {};
  if (!grocery_name) return res.status(400).json({ detail: 'grocery_name is required' });
  
  const newItem = {
    id: nextShoppingItemId++,
    list_id: id,
    grocery_name: String(grocery_name),
    quantity: Number(quantity) || 1,
    checked: false,
  };
  list.items.push(newItem);
  res.status(201).json(list);
});

app.post('/shopping-lists/:id/complete', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const list = shoppingLists.find((l) => l.id === id && l.user_id === req.user.id);
  if (!list) return res.status(404).json({ detail: 'Not found' });
  list.completed = true;
  res.json(list);
});

app.put('/shopping-lists/:listId/items/:itemId/toggle', authMiddleware, (req, res) => {
  const listId = Number(req.params.listId);
  const itemId = Number(req.params.itemId);
  const list = shoppingLists.find((l) => l.id === listId && l.user_id === req.user.id);
  if (!list) return res.status(404).json({ detail: 'List not found' });
  const item = list.items.find((i) => i.id === itemId);
  if (!item) return res.status(404).json({ detail: 'Item not found' });
  item.checked = !item.checked;
  res.json(list);
});

app.get('/shopping-lists/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const list = shoppingLists.find((l) => l.id === id && l.user_id === req.user.id);
  if (!list) return res.status(404).json({ detail: 'Not found' });
  res.json(list);
});

// Helper: Text mit Gemini übersetzen
async function translateTextWithGemini(text, targetLanguage) {
  if (!genAI) {
    throw new Error('Gemini API Key nicht gesetzt');
  }

  try {
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } catch (error) {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    }

    const languageName = targetLanguage === 'de' ? 'Deutsch' : 'English';
    const prompt = `Übersetze den folgenden Rezept-Text genau ins ${languageName}. 

WICHTIG:
- Übersetze NUR den Text, behalte HTML-Tags bei (falls vorhanden)
- Übersetze koch-spezifische Begriffe korrekt
- Behalte die Formatierung bei
- Falls der Text bereits auf ${languageName} ist, gib ihn unverändert zurück

Text:
${text}`;

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini Übersetzungsfehler:', error);
    throw error;
  }
}

// Helper: Google Gemini Vision für Bildanalyse
async function analyzeImageWithGemini(imageBuffer, mimeType) {
  if (!genAI) {
    throw new Error('Gemini API Key nicht gesetzt');
  }

  try {
    // Verwende Gemini 2.5 Flash für Bildanalyse (aktuellstes und schnellstes Modell)
    let model;
    try {
      // Verwende gemini-2.5-flash (aktuellste Version)
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      console.log('✅ Verwende Modell: gemini-2.5-flash');
    } catch (error) {
      console.warn('⚠️ gemini-2.5-flash nicht verfügbar, verwende gemini-2.5-pro');
      // Fallback auf gemini-2.5-pro
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        console.log('✅ Verwende Modell: gemini-2.5-pro');
      } catch (error2) {
        console.error('❌ Weder gemini-2.5-flash noch gemini-2.5-pro verfügbar:', error2.message);
        throw new Error('Kein verfügbares Gemini 2.5 Modell gefunden');
      }
    }
    
    // Base64 encoding für Gemini
    const base64Image = imageBuffer.toString('base64');
    
    const prompt = `Du siehst ein Foto von Lebensmitteln. Analysiere das Bild und liste ALLE erkennbaren Lebensmittel auf, die sichtbar sind.

WICHTIG: 
- Gib NUR eine kommagetrennte Liste zurück (auf Englisch)
- Keine zusätzlichen Erklärungen, keine Markdown-Formatierung, keine Nummerierung
- Format: Milk, Eggs, Tomatoes, Cheese, Butter
- Nur Lebensmittelnamen, getrennt durch Kommas`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType || 'image/jpeg',
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('📝 Gemini Rohtext-Antwort:', text);
    
    // Extrahiere Lebensmittel aus der Antwort
    const foods = text
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0)
      .map(f => f.replace(/^\d+\.\s*/, '')) // Entferne Nummerierung falls vorhanden
      .filter(f => !f.toLowerCase().includes('example') && !f.toLowerCase().includes('format'))
      .map(f => f.replace(/^[-•]\s*/, '')) // Entferne Bullet Points
      .filter(f => f.length > 0);

    console.log('🔍 Extrahierte Lebensmittel:', foods);

    if (foods.length === 0) {
      console.warn('⚠️ Keine Lebensmittel extrahiert, verwende Fallback');
      return ['Milk', 'Eggs', 'Tomatoes']; // Fallback
    }

    return foods;
  } catch (error) {
    console.error('Gemini API Fehler:', error);
    throw error;
  }
}

// Helper: Spoonacular Recipe API für Rezeptvorschläge (mit KI-Lernen basierend auf gekochten Rezepten)
async function getRecipeSuggestions(ingredients, userId) {
  // Hole gekochte Rezepte des Users für personalisierte Vorschläge
  const userCookedRecipes = cookedRecipes.filter((r) => r.user_id === userId);
  const cookedRecipeIds = userCookedRecipes.map((r) => r.recipe_id);
  const preferredRecipeTitles = userCookedRecipes
    .filter((r) => r.rating && r.rating >= 4) // Nur gut bewertete Rezepte
    .map((r) => r.recipe_title.toLowerCase());
  
  if (!SPOONACULAR_API_KEY) {
    // Fallback: Stub-Daten wenn API Key fehlt
    return [
      {
        id: 1,
        title: 'Scrambled Eggs with Tomatoes',
        image: 'https://images.unsplash.com/photo-1615367424476-35335d4d2f38?w=400',
        used_ingredients: [{ name: 'Eggs', amount: 3, unit: 'pcs' }, { name: 'Tomatoes', amount: 2, unit: 'pcs' }],
        missed_ingredients: [{ name: 'Salt', amount: 1, unit: 'pinch' }],
        likes: 1245,
      },
    ];
  }

  try {
    // Hole Rezepte basierend auf Zutaten
    const ingredientsString = Array.isArray(ingredients) ? ingredients.join(',') : ingredients;
    const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
      params: {
        ingredients: ingredientsString,
        number: 3,
        ranking: 2, // Maximize used ingredients
        ignorePantry: true,
        apiKey: SPOONACULAR_API_KEY,
      },
      timeout: 10000,
    });

    let recipes = response.data || [];
    
    // KI-Lernen: Sortiere Rezepte basierend auf User-Präferenzen
    // 1. Bevorzuge ähnliche Rezepte zu bereits gekochten (wenn gut bewertet)
    // 2. Vermeide bereits gekochte Rezepte (außer sie waren sehr gut bewertet)
    recipes = recipes.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      
      // Prüfe ob Rezept ähnlich zu bevorzugten Rezepten ist
      const aIsPreferred = preferredRecipeTitles.some(pref => 
        aTitle.includes(pref.split(' ')[0]) || pref.split(' ').some(word => aTitle.includes(word))
      );
      const bIsPreferred = preferredRecipeTitles.some(pref => 
        bTitle.includes(pref.split(' ')[0]) || pref.split(' ').some(word => bTitle.includes(word))
      );
      
      // Bevorzuge ähnliche Rezepte
      if (aIsPreferred && !bIsPreferred) return -1;
      if (!aIsPreferred && bIsPreferred) return 1;
      
      // Vermeide bereits gekochte Rezepte (außer sehr gut bewertet)
      const aIsCooked = cookedRecipeIds.includes(a.id);
      const bIsCooked = cookedRecipeIds.includes(b.id);
      if (aIsCooked && !bIsCooked) return 1; // Nicht gekochte bevorzugen
      if (!aIsCooked && bIsCooked) return -1;
      
      // Ansonsten nach verwendet Ingredients sortieren
      return (b.usedIngredientCount || 0) - (a.usedIngredientCount || 0);
    });
    
    // Hole Details für jedes Rezept (für vollständige Zutatenliste)
    const recipeDetails = await Promise.all(
      recipes.slice(0, 3).map(async (recipe) => {
        try {
          const detailResponse = await axios.get(
            `https://api.spoonacular.com/recipes/${recipe.id}/information`,
            {
              params: {
                includeNutrition: false,
                apiKey: SPOONACULAR_API_KEY,
              },
              timeout: 10000,
            }
          );

          const detail = detailResponse.data;
          
          // Bestimme used und missed ingredients (sicherstellen dass Arrays vorhanden sind)
          const usedIng = (Array.isArray(recipe.usedIngredients) ? recipe.usedIngredients : []).map(ing => ({
            name: ing.name,
            amount: ing.amount || 1,
            unit: ing.unit || 'pcs',
          }));
          
          const missedIng = (Array.isArray(recipe.missedIngredients) ? recipe.missedIngredients : []).map(ing => ({
            name: ing.name,
            amount: ing.amount || 1,
            unit: ing.unit || 'pcs',
          }));

          const recipeData = {
            id: recipe.id,
            title: recipe.title || detail.title || 'Unnamed Recipe',
            image: recipe.image || detail.image || 'https://via.placeholder.com/400',
            used_ingredients: usedIng,
            missed_ingredients: missedIng,
            likes: detail.aggregateLikes || 0,
            sourceUrl: detail.sourceUrl || '',
          };
          console.log('🍳 Rezept-Daten vorbereitet:', recipeData.id, '-', recipeData.title);
          return recipeData;
        } catch (err) {
          console.error(`Fehler beim Laden von Rezept ${recipe.id}:`, err.message);
          // Fallback für fehlgeschlagene Details
          return {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image || 'https://via.placeholder.com/400',
            used_ingredients: (Array.isArray(recipe.usedIngredients) ? recipe.usedIngredients : []).map(ing => ({
              name: ing.name,
              amount: ing.amount || 1,
              unit: ing.unit || 'pcs',
            })),
            missed_ingredients: (Array.isArray(recipe.missedIngredients) ? recipe.missedIngredients : []).map(ing => ({
              name: ing.name,
              amount: ing.amount || 1,
              unit: ing.unit || 'pcs',
            })),
            likes: 0,
          };
        }
      })
    );

    console.log('🍳 Alle Rezept-Details vorbereitet:', recipeDetails.length);
    console.log('🍳 Rezept-IDs:', recipeDetails.map(r => r.id));
    return recipeDetails;
  } catch (error) {
    console.error('Spoonacular API Fehler:', error.message);
    // Fallback auf Stub-Daten bei Fehler
    const fallbackRecipes = [
      {
        id: 1,
        title: 'Recipe with your ingredients',
        image: 'https://images.unsplash.com/photo-1615367424476-35335d4d2f38?w=400',
        used_ingredients: Array.isArray(ingredients) ? ingredients.slice(0, 3).map(name => ({ name, amount: 1, unit: 'pcs' })) : [],
        missed_ingredients: [],
        likes: 0,
        sourceUrl: '',
      },
    ];
    console.log('🍳 Fallback-Rezepte zurückgegeben:', fallbackRecipes.length);
    return fallbackRecipes;
  }
}

// Photo recognition mit Google Gemini + Spoonacular
app.post('/photo-recognition/analyze-fridge', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    console.log('📸 Foto-Analyse gestartet für User:', req.user.id);
    console.log('📦 Datei-Info:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      hasBuffer: !!req.file.buffer
    });

    let recognizedFoods = [];

    // Schritt 1: Bildanalyse mit Gemini
    console.log('🔑 Gemini API Key Status:', {
      hasKey: !!GEMINI_API_KEY,
      keyLength: GEMINI_API_KEY ? GEMINI_API_KEY.length : 0,
      genAIInitialized: !!genAI
    });

    if (genAI && GEMINI_API_KEY) {
      try {
        console.log('🚀 Rufe Gemini API auf...');
        console.log('⏱️  Startzeit:', new Date().toISOString());
        recognizedFoods = await analyzeImageWithGemini(req.file.buffer, req.file.mimetype);
        console.log('⏱️  Endzeit:', new Date().toISOString());
        console.log('✅ Gemini erkannte Lebensmittel:', recognizedFoods);
        console.log('📊 Anzahl erkannte Lebensmittel:', recognizedFoods.length);
        
        if (!recognizedFoods || recognizedFoods.length === 0) {
          console.warn('⚠️ Gemini hat keine Lebensmittel zurückgegeben, verwende Fallback');
          recognizedFoods = ['Milk', 'Eggs', 'Tomatoes', 'Cheese', 'Butter'];
        }
      } catch (error) {
        console.error('❌ Gemini Fehler, verwende Fallback:', error.message);
        console.error('❌ Gemini Fehler Stack:', error.stack);
        console.error('❌ Gemini Fehler Details:', JSON.stringify(error, null, 2));
        // Fallback auf Stub-Daten
        recognizedFoods = ['Milk', 'Eggs', 'Tomatoes', 'Cheese', 'Butter'];
        console.log('📦 Fallback-Daten verwendet:', recognizedFoods);
      }
    } else {
      // Fallback wenn kein API Key gesetzt
      console.warn('⚠️ Gemini API Key fehlt oder genAI nicht initialisiert!');
      console.warn('⚠️ genAI ist:', genAI ? 'initialisiert' : 'NULL');
      console.warn('⚠️ GEMINI_API_KEY ist:', GEMINI_API_KEY ? 'gesetzt (' + GEMINI_API_KEY.substring(0, 10) + '...)' : 'NICHT gesetzt');
      recognizedFoods = ['Milk', 'Eggs', 'Tomatoes', 'Cheese', 'Butter'];
      console.log('📦 Stub-Daten verwendet:', recognizedFoods);
    }

    // Schritt 2: Hole User's aktuelles Inventar für bessere Rezeptvorschläge
    const userGroceries = groceries.filter((g) => g.user_id === req.user.id);
    const availableIngredients = [
      ...recognizedFoods,
      ...userGroceries.map((g) => g.name),
    ];

    console.log('🥘 Verfügbare Zutaten für Rezeptvorschläge:', availableIngredients);

    // Schritt 3: Hole Rezeptvorschläge von Spoonacular (mit KI-Lernen basierend auf gekochten Rezepten)
    console.log('🍳 Hole Rezeptvorschläge von Spoonacular...');
    const recipeSuggestions = await getRecipeSuggestions(availableIngredients, req.user.id);
    console.log('✅ Rezeptvorschläge erhalten:', recipeSuggestions.length, 'Rezepte');

    // Schritt 4: Speichere Rezepte automatisch für die Rezepte-Seite
    console.log('💾 Prüfe Rezepte zum Speichern für User', req.user.id);
    console.log('💾 Rezeptvorschläge erhalten:', recipeSuggestions.length);
    const savedRecipeIds = [];
    for (const recipe of recipeSuggestions) {
      if (!recipe || !recipe.id) {
        console.warn('⚠️ Ungültiges Rezept übersprungen:', recipe);
        continue;
      }
      
      // Prüfe ob Rezept bereits gespeichert ist
      const existing = savedRecipes.find(
        (r) => r.user_id === req.user.id && r.recipe_id === recipe.id
      );
      
      if (!existing) {
        const saved = {
          id: nextSavedRecipeId++,
          user_id: req.user.id,
          recipe_id: recipe.id,
          title: recipe.title || 'Unnamed Recipe',
          image: recipe.image || 'https://via.placeholder.com/400',
          used_ingredients: recipe.used_ingredients || [],
          missed_ingredients: recipe.missed_ingredients || [],
          likes: recipe.likes || 0,
          sourceUrl: recipe.sourceUrl || '',
          saved_at: new Date().toISOString(),
        };
        savedRecipes.push(saved);
        savedRecipeIds.push(saved.id);
        console.log('✅ Rezept gespeichert:', saved.id, '-', saved.title);
      } else {
        console.log('ℹ️ Rezept bereits vorhanden:', recipe.id, '-', recipe.title);
      }
    }
    console.log('💾 Gesamt gespeichert:', savedRecipeIds.length, 'neue Rezepte');
    console.log('💾 Gesamt gespeicherte Rezepte für User:', savedRecipes.filter(r => r.user_id === req.user.id).length);

    // Stelle sicher, dass immer Arrays zurückgegeben werden (auch wenn leer)
    const response = {
      recognized_foods: Array.isArray(recognizedFoods) ? recognizedFoods : [],
      recipe_suggestions: Array.isArray(recipeSuggestions) ? recipeSuggestions : [],
      message: GEMINI_API_KEY ? 'Analyse erfolgreich (Gemini + Spoonacular)' : 'Analyse erfolgreich (Stub-Daten)',
    };

    console.log('📤 Sende Antwort:', {
      recognized_foods_count: response.recognized_foods.length,
      recipe_suggestions_count: response.recipe_suggestions.length,
      message: response.message
    });

    res.json(response);
  } catch (error) {
    console.error('Foto-Analyse Fehler:', error);
    res.status(500).json({ detail: 'Fehler bei der Foto-Analyse: ' + error.message });
  }
});

app.post('/photo-recognition/add-recognized-groceries', authMiddleware, (req, res) => {
  const { food_items } = req.body || {};
  if (!Array.isArray(food_items)) return res.status(400).json({ detail: 'food_items must be array' });
  const created = food_items.map((name) => {
    const item = {
      id: nextGroceryId++,
      user_id: req.user.id,
      name: String(name),
      quantity: 1,
      unit: 'pcs',
      category: 'Other',
      added_date: new Date().toISOString(),
      low_stock_threshold: 0,
    };
    groceries.push(item);
    return item;
  });
  res.status(201).json({ created });
});

// Rezept-Details von Spoonacular
app.get('/photo-recognition/recipe-details/:recipeId', authMiddleware, async (req, res) => {
  try {
    const recipeId = Number(req.params.recipeId);

    if (!SPOONACULAR_API_KEY) {
      // Fallback wenn API Key fehlt
      return res.json({
        id: recipeId,
        title: `Recipe #${recipeId}`,
        ingredients: ['Sample Ingredient 1', 'Sample Ingredient 2'],
        instructions: 'Mix ingredients and cook.',
        servings: 2,
        image: 'https://via.placeholder.com/400',
        sourceUrl: '',
      });
    }

    try {
      const response = await axios.get(
        `https://api.spoonacular.com/recipes/${recipeId}/information`,
        {
          params: {
            includeNutrition: false,
            apiKey: SPOONACULAR_API_KEY,
          },
          timeout: 10000,
        }
      );

      const recipe = response.data;

      res.json({
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        ingredients: (recipe.extendedIngredients || []).map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          original: ing.original,
        })),
        instructions: recipe.instructions || recipe.summary || 'No instructions available',
        servings: recipe.servings || 2,
        readyInMinutes: recipe.readyInMinutes || 0,
        sourceUrl: recipe.sourceUrl || recipe.spoonacularSourceUrl || '',
      });
    } catch (error) {
      console.error('Spoonacular Detail API Fehler:', error.message);
      res.status(500).json({ detail: 'Rezept konnte nicht geladen werden' });
    }
  } catch (error) {
    console.error('Rezept-Details Fehler:', error);
    res.status(500).json({ detail: 'Fehler beim Laden der Rezept-Details' });
  }
});

// Gekochte Rezepte speichern (für KI-Lernen)
app.post('/photo-recognition/cooked-recipe', authMiddleware, (req, res) => {
  const { recipe_id, recipe_title, rating } = req.body || {};
  if (!recipe_id || !recipe_title) {
    return res.status(400).json({ detail: 'recipe_id und recipe_title erforderlich' });
  }

  const cooked = {
    id: nextCookedRecipeId++,
    user_id: req.user.id,
    recipe_id: Number(recipe_id),
    recipe_title: String(recipe_title),
    cooked_at: new Date().toISOString(),
    rating: rating != null ? Number(rating) : undefined,
  };
  cookedRecipes.push(cooked);
  res.status(201).json(cooked);
});

// Gekochte Rezepte abrufen (für zukünftige personalisierte Vorschläge)
app.get('/photo-recognition/cooked-recipes', authMiddleware, (req, res) => {
  const userCooked = cookedRecipes.filter((r) => r.user_id === req.user.id);
  res.json(userCooked);
});

// Gespeicherte Rezepte abrufen (für Rezepte-Seite)
app.get('/recipes', authMiddleware, (req, res) => {
  console.log('📖 Hole gespeicherte Rezepte für User:', req.user.id);
  console.log('📖 Gesamt gespeicherte Rezepte:', savedRecipes.length);
  
  const userRecipes = savedRecipes
    .filter((r) => r.user_id === req.user.id)
    .sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at)); // Neueste zuerst
  
  console.log('📖 Rezepte für User gefunden:', userRecipes.length);
  
  // Füge "gekocht" Status hinzu
  const userCookedIds = cookedRecipes
    .filter((r) => r.user_id === req.user.id)
    .map((r) => r.recipe_id);
  
  const recipesWithStatus = userRecipes.map((recipe) => ({
    ...recipe,
    is_cooked: userCookedIds.includes(recipe.recipe_id),
    cooked_info: cookedRecipes.find(
      (r) => r.user_id === req.user.id && r.recipe_id === recipe.recipe_id
    ),
  }));
  
  console.log('📖 Sende', recipesWithStatus.length, 'Rezepte');
  res.json(recipesWithStatus);
});

// Einzelnes Rezept löschen
app.delete('/recipes/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const index = savedRecipes.findIndex(
    (r) => r.id === id && r.user_id === req.user.id
  );
  
  if (index === -1) {
    return res.status(404).json({ detail: 'Rezept nicht gefunden' });
  }
  
  savedRecipes.splice(index, 1);
  res.json({ success: true });
});

// Rezept-Anleitung übersetzen
app.post('/photo-recognition/translate-instructions', authMiddleware, async (req, res) => {
  try {
    const { text, targetLanguage } = req.body || {};
    
    if (!text) {
      return res.status(400).json({ detail: 'Text erforderlich' });
    }

    if (!targetLanguage || targetLanguage === 'en') {
      // Keine Übersetzung nötig
      return res.json({ translated_text: text });
    }

    if (!genAI || !GEMINI_API_KEY) {
      console.warn('Gemini API Key fehlt, keine Übersetzung möglich');
      return res.json({ translated_text: text }); // Original zurückgeben
    }

    try {
      console.log('🌍 Übersetze Rezept-Anleitung ins', targetLanguage);
      const translated = await translateTextWithGemini(text, targetLanguage);
      console.log('✅ Übersetzung erfolgreich');
      res.json({ translated_text: translated });
    } catch (error) {
      console.error('❌ Übersetzungsfehler:', error.message);
      // Bei Fehler Original zurückgeben
      res.json({ translated_text: text });
    }
  } catch (error) {
    console.error('Übersetzungs-Endpoint Fehler:', error);
    res.status(500).json({ detail: 'Fehler bei der Übersetzung' });
  }
});

// Rezept-Zutaten übersetzen
app.post('/photo-recognition/translate-ingredients', authMiddleware, async (req, res) => {
  try {
    const { ingredients, targetLanguage } = req.body || {};
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ detail: 'Zutaten-Array erforderlich' });
    }

    if (!targetLanguage || targetLanguage === 'en') {
      // Keine Übersetzung nötig
      return res.json({ translated_ingredients: ingredients });
    }

    if (!genAI || !GEMINI_API_KEY) {
      console.warn('Gemini API Key fehlt, keine Übersetzung möglich');
      return res.json({ translated_ingredients: ingredients }); // Original zurückgeben
    }

    try {
      console.log('🌍 Übersetze', ingredients.length, 'Zutaten ins', targetLanguage);
      
      // Erstelle eine kommagetrennte Liste der Zutaten
      const ingredientNames = ingredients.map(ing => typeof ing === 'string' ? ing : ing.name || ing);
      
      // Übersetze jede Zutat einzeln für bessere Qualität
      const translatedNames = [];
      for (const ingName of ingredientNames) {
        try {
          const translatedText = await translateTextWithGemini(
            `Übersetze nur diesen einen Lebensmittel-Zutaten-Namen ins Deutsche (ohne Mengenangaben, nur der Zutaten-Name): ${ingName}`,
            targetLanguage
          );
          // Clean up: Entferne mögliche zusätzliche Text aus der Antwort
          const cleanName = translatedText.split(',')[0].trim().split('\n')[0].trim();
          translatedNames.push(cleanName || ingName);
        } catch (err) {
          // Bei Fehler Original verwenden
          translatedNames.push(ingName);
        }
      }
      
      // Mappe übersetzte Namen zurück zu den originalen Zutaten-Objekten
      const translatedIngredients = ingredients.map((ing, index) => {
        const originalName = typeof ing === 'string' ? ing : ing.name || '';
        const translatedName = translatedNames[index] || originalName;
        
        if (typeof ing === 'string') {
          return translatedName;
        }
        return {
          ...ing,
          name: translatedName
        };
      });
      
      console.log('✅ Zutaten-Übersetzung erfolgreich');
      res.json({ translated_ingredients: translatedIngredients });
    } catch (error) {
      console.error('❌ Zutaten-Übersetzungsfehler:', error.message);
      // Bei Fehler Original zurückgeben
      res.json({ translated_ingredients: ingredients });
    }
  } catch (error) {
    console.error('Zutaten-Übersetzungs-Endpoint Fehler:', error);
    res.status(500).json({ detail: 'Fehler bei der Zutaten-Übersetzung' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

// Chat Endpoints
app.post('/chat/message', authMiddleware, async (req, res) => {
  try {
    const { message, context } = req.body || {};
    
    if (!message) {
      return res.status(400).json({ detail: 'Nachricht erforderlich' });
    }

    if (!genAI || !GEMINI_API_KEY) {
      return res.status(503).json({ detail: 'Chat-Service nicht verfügbar' });
    }

    try {
      let model;
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      } catch (error) {
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      }

      const prompt = `Du bist der Smart Pantry Assistent, ein hilfreicher Chatbot für eine Lebensmittel-Inventarverwaltungs-App.

WICHTIG:
- Antworte AUSSCHLIESSLICH zu Fragen über Smart Pantry
- Keine allgemeinen Konversationen oder Themen außerhalb der App
- Wenn Fragen nicht zur App gehören, leite höflich zum Issue-System weiter
- Sei präzise und hilfreich
- Maximal 200 Wörter pro Antwort

Kontext: ${context || 'smart-pantry'}
Nutzer-Frage: ${message}

Antworte hilfreich und projektbezogen:`;

      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const botResponse = response.text();

      res.json({ response: botResponse });
    } catch (error) {
      console.error('Chat-Fehler:', error);
      res.status(500).json({ detail: 'Fehler bei der Chat-Antwort' });
    }
  } catch (error) {
    console.error('Chat-Endpoint Fehler:', error);
    res.status(500).json({ detail: 'Fehler beim Chat-Endpoint' });
  }
});

// GitHub Issue erstellen
app.post('/chat/create-issue', authMiddleware, async (req, res) => {
  try {
    const { title, body, labels = [] } = req.body || {};
    
    if (!title || !body) {
      return res.status(400).json({ detail: 'Title und Body erforderlich' });
    }

    // GitHub API Token aus Umgebungsvariablen
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
    
    if (!GITHUB_TOKEN) {
      console.warn('⚠️ GITHUB_TOKEN nicht gesetzt, Issue kann nicht erstellt werden');
      // Erstelle Issue-Template URL mit vorausgefüllten Daten
      try {
        const issueTemplateUrl = `https://github.com/Jacha93/smart-pantry/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
        return res.status(503).json({ 
          detail: 'GitHub Integration nicht konfiguriert',
          fallback_url: issueTemplateUrl,
          message: 'Bitte erstelle das Issue manuell über den bereitgestellten Link'
        });
      } catch (urlError) {
        console.error('Fehler beim Erstellen der Issue-Template URL:', urlError);
        return res.status(503).json({ 
          detail: 'GitHub Integration nicht konfiguriert',
          fallback_url: 'https://github.com/Jacha93/smart-pantry/issues/new'
        });
      }
    }

    try {
      // Versuche Issue zu erstellen, ignoriere Labels wenn sie nicht existieren
      const issueData = {
        title,
        body: `${body}\n\n---\n*Issue erstellt über Smart Pantry Chat-Bubble*`,
      };
      
      // Füge Labels nur hinzu, wenn sie angegeben wurden (GitHub wird automatisch validieren)
      // Wenn Labels nicht existieren, wird GitHub sie ignorieren oder einen Fehler geben
      // Wir versuchen es erstmal ohne Labels, dann mit Labels falls angegeben
      if (labels && labels.length > 0) {
        issueData.labels = ['user-reported', ...labels];
      }

      const githubResponse = await axios.post(
        'https://api.github.com/repos/Jacha93/smart-pantry/issues',
        issueData,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`, // Bearer ist für neue Tokens empfohlen, funktioniert auch mit token
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      console.log('✅ GitHub Issue erstellt:', githubResponse.data.html_url);
      res.json({
        success: true,
        data: {
          html_url: githubResponse.data.html_url,
          number: githubResponse.data.number,
        }
      });
    } catch (error) {
      console.error('❌ GitHub API Fehler:', error.response?.data || error.message);
      
      // Wenn der Fehler wegen nicht existierender Labels ist, versuche es ohne Labels
      if (error.response?.status === 422 && error.response?.data?.errors?.some((e) => e.resource === 'Label')) {
        console.log('⚠️ Label-Fehler erkannt, versuche ohne Labels...');
        try {
          const githubResponse = await axios.post(
            'https://api.github.com/repos/Jacha93/smart-pantry/issues',
            {
              title,
              body: `${body}\n\n---\n*Issue erstellt über Smart Pantry Chat-Bubble*`,
            },
            {
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );

          console.log('✅ GitHub Issue erstellt (ohne Labels):', githubResponse.data.html_url);
          return res.json({
            success: true,
            data: {
              html_url: githubResponse.data.html_url,
              number: githubResponse.data.number,
            }
          });
        } catch (retryError) {
          console.error('❌ Retry ohne Labels fehlgeschlagen:', retryError.response?.data || retryError.message);
          // Fallback zu Issue-Template URL
          const issueTemplateUrl = `https://github.com/Jacha93/smart-pantry/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
          return res.status(500).json({ 
            detail: 'Fehler beim Erstellen des GitHub Issues',
            fallback_url: issueTemplateUrl,
            github_error: retryError.response?.data?.message || retryError.message
          });
        }
      }
      
      // Erstelle Issue-Template URL mit vorausgefüllten Daten als Fallback
      try {
        const issueTemplateUrl = `https://github.com/Jacha93/smart-pantry/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
        res.status(500).json({ 
          detail: 'Fehler beim Erstellen des GitHub Issues',
          fallback_url: issueTemplateUrl,
          github_error: error.response?.data?.message || error.message
        });
      } catch (urlError) {
        console.error('Fehler beim Erstellen der Issue-Template URL:', urlError);
        res.status(500).json({ 
          detail: 'Fehler beim Erstellen des GitHub Issues',
          fallback_url: 'https://github.com/Jacha93/smart-pantry/issues/new',
          github_error: error.response?.data?.message || error.message
        });
      }
    }
  } catch (error) {
    console.error('Issue-Endpoint Fehler:', error);
    // Versuche auch hier eine Fallback-URL zu erstellen
    try {
      const title = req.body?.title || 'Issue';
      const body = req.body?.body || '';
      const issueTemplateUrl = `https://github.com/Jacha93/smart-pantry/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
      res.status(500).json({ 
        detail: 'Fehler beim Issue-Endpoint',
        fallback_url: issueTemplateUrl
      });
    } catch (urlError) {
      res.status(500).json({ 
        detail: 'Fehler beim Issue-Endpoint',
        fallback_url: 'https://github.com/Jacha93/smart-pantry/issues/new'
      });
    }
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ detail: 'Internal server error' });
});

// Error-Handling für Server-Start
let server;
try {
  server = app.listen(PORT, () => {
    console.log(`✅ API listening on http://localhost:${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} ist bereits belegt!`);
      console.error(`   Bitte beende den anderen Prozess:`);
      console.error(`   kill $(lsof -t -i:${PORT})`);
      console.error(`   Oder ändere PORT in .env\n`);
    } else {
      console.error('❌ Server-Fehler:', error);
    }
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Fehler beim Starten des Servers:', error);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Unhandled Promise Rejections abfangen
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Server nicht sofort beenden, nur loggen (für Production)
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  server.close(() => {
    process.exit(1);
  });
});


