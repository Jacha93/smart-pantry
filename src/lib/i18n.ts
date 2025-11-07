'use client';

export type Locale = 'en' | 'de';

interface Translations {
  [key: string]: {
    en: string;
    de: string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav.groceries': { en: 'Groceries', de: 'Lebensmittel' },
  'nav.shoppingList': { en: 'Shopping List', de: 'Einkaufsliste' },
  'nav.fridgeAnalyzer': { en: 'Fridge Analyzer', de: 'Kühlschrank-Analyse' },
  'nav.recipes': { en: 'Recipes', de: 'Rezepte' },
  'nav.logout': { en: 'Logout', de: 'Abmelden' },
  'nav.appTitle': { en: 'Smart Pantry', de: 'Smart Pantry' },

  // Auth
  'auth.signIn': { en: 'Sign in', de: 'Anmelden' },
  'auth.signUp': { en: 'Sign up', de: 'Registrieren' },
  'auth.createAccount': { en: 'Create account', de: 'Konto erstellen' },
  'auth.email': { en: 'Email', de: 'E-Mail' },
  'auth.password': { en: 'Password', de: 'Passwort' },
  'auth.name': { en: 'Full Name', de: 'Vollständiger Name' },
  'auth.confirmPassword': { en: 'Confirm Password', de: 'Passwort bestätigen' },
  'auth.enterEmailPassword': { en: 'Enter your email and password to access your grocery inventory', de: 'Gib deine E-Mail und dein Passwort ein, um auf dein Lebensmittel-Inventar zuzugreifen' },
  'auth.enterDetails': { en: 'Enter your details to create your grocery inventory account', de: 'Gib deine Daten ein, um ein Lebensmittel-Inventar-Konto zu erstellen' },
  'auth.noAccount': { en: "Don't have an account?", de: 'Noch kein Konto?' },
  'auth.haveAccount': { en: 'Already have an account?', de: 'Bereits ein Konto?' },
  'auth.signingIn': { en: 'Signing in...', de: 'Anmelden...' },
  'auth.creatingAccount': { en: 'Creating account...', de: 'Konto wird erstellt...' },

  // Groceries
  'groceries.title': { en: 'Groceries', de: 'Lebensmittel' },
  'groceries.subtitle': { en: 'Manage your grocery inventory', de: 'Verwalte dein Lebensmittel-Inventar' },
  'groceries.add': { en: 'Add Grocery', de: 'Lebensmittel hinzufügen' },
  'groceries.addNew': { en: 'Add New Grocery', de: 'Neues Lebensmittel hinzufügen' },
  'groceries.name': { en: 'Name', de: 'Name' },
  'groceries.quantity': { en: 'Quantity', de: 'Menge' },
  'groceries.unit': { en: 'Unit', de: 'Einheit' },
  'groceries.category': { en: 'Category', de: 'Kategorie' },
  'groceries.expiryDate': { en: 'Expiry Date (Optional)', de: 'Ablaufdatum (Optional)' },
  'groceries.lowStockThreshold': { en: 'Low Stock Threshold', de: 'Mindestbestand' },
  'groceries.selectUnit': { en: 'Select unit', de: 'Einheit auswählen' },
  'groceries.selectCategory': { en: 'Select category', de: 'Kategorie auswählen' },
  'groceries.pickDate': { en: 'Pick a date', de: 'Datum auswählen' },
  'groceries.cancel': { en: 'Cancel', de: 'Abbrechen' },
  'groceries.adding': { en: 'Adding...', de: 'Hinzufügen...' },
  'groceries.inventory': { en: 'Inventory', de: 'Inventar' },
  'groceries.inventoryDesc': { en: 'View and manage all your groceries. Items with low stock or expiring soon are highlighted.', de: 'Zeige und verwalte alle deine Lebensmittel. Artikel mit niedrigem Bestand oder die bald ablaufen, sind hervorgehoben.' },
  'groceries.enterName': { en: 'Enter grocery name', de: 'Lebensmittel-Name eingeben' },
  'groceries.nameRequired': { en: 'Name is required', de: 'Name ist erforderlich' },
  'groceries.quantityPositive': { en: 'Quantity must be positive', de: 'Menge muss positiv sein' },
  'groceries.unitRequired': { en: 'Unit is required', de: 'Einheit ist erforderlich' },
  'groceries.categoryRequired': { en: 'Category is required', de: 'Kategorie ist erforderlich' },
  'groceries.thresholdPositive': { en: 'Threshold must be positive', de: 'Mindestbestand muss positiv sein' },
  'groceries.addedSuccess': { en: 'Grocery added successfully!', de: 'Lebensmittel erfolgreich hinzugefügt!' },
  'groceries.failedToAdd': { en: 'Failed to add grocery', de: 'Lebensmittel konnte nicht hinzugefügt werden' },
  'groceries.failedToFetch': { en: 'Failed to fetch groceries', de: 'Lebensmittel konnten nicht geladen werden' },
  'groceries.deleteConfirm': { en: 'Are you sure you want to delete this grocery?', de: 'Möchtest du dieses Lebensmittel wirklich löschen?' },
  'groceries.deletedSuccess': { en: 'Grocery deleted successfully', de: 'Lebensmittel erfolgreich gelöscht' },
  'groceries.failedToDelete': { en: 'Failed to delete grocery', de: 'Lebensmittel konnte nicht gelöscht werden' },

  // Fridge Analyzer
  'fridge.title': { en: 'Fridge Analyzer', de: 'Kühlschrank-Analyse' },
  'fridge.subtitle': { en: 'Take a photo of your fridge and discover what recipes you can make', de: 'Mach ein Foto deines Kühlschranks und entdecke, welche Rezepte du kochen kannst' },
  'fridge.cardTitle': { en: 'Fridge Photo Analyzer', de: 'Kühlschrank-Foto-Analyse' },
  'fridge.cardDescription': { en: 'Take a photo of your fridge and get recipe suggestions based on what you have', de: 'Mach ein Foto deines Kühlschranks und erhalte Rezeptvorschläge basierend auf deinen vorhandenen Lebensmitteln' },
  'fridge.uploadPhoto': { en: 'Upload a photo of your fridge', de: 'Lade ein Foto deines Kühlschranks hoch' },
  'fridge.uploadDescription': { en: 'Take a clear photo showing all the food items in your fridge', de: 'Mach ein klares Foto, das alle Lebensmittel in deinem Kühlschrank zeigt' },
  'fridge.choosePhoto': { en: 'Choose Photo', de: 'Foto auswählen' },
  'fridge.retake': { en: 'Retake', de: 'Erneut aufnehmen' },
  'fridge.analyzePhoto': { en: 'Analyze Photo', de: 'Foto analysieren' },
  'fridge.analyzing': { en: 'Analyzing...', de: 'Analysiere...' },
  'fridge.analyzeSuccess': { en: 'Photo analyzed successfully!', de: 'Foto erfolgreich analysiert!' },
  'fridge.analyzeFailed': { en: 'Failed to analyze photo', de: 'Foto konnte nicht analysiert werden' },
  'fridge.recognizedItems': { en: 'Recognized Food Items', de: 'Erkannte Lebensmittel' },
  'fridge.foundItems': { en: 'Found {count} food items in your fridge', de: '{count} Lebensmittel in deinem Kühlschrank gefunden' },
  'fridge.addAllToInventory': { en: 'Add All to Inventory', de: 'Alle zum Inventar hinzufügen' },
  'fridge.addingToInventory': { en: 'Adding to Inventory...', de: 'Füge zum Inventar hinzu...' },
  'fridge.addSuccess': { en: 'Food items added to inventory!', de: 'Lebensmittel zum Inventar hinzugefügt!' },
  'fridge.addFailed': { en: 'Failed to add items to inventory', de: 'Lebensmittel konnten nicht zum Inventar hinzugefügt werden' },
  'fridge.recipeSuggestions': { en: 'Recipe Suggestions', de: 'Rezeptvorschläge' },
  'fridge.recipeDescription': { en: 'Here are 3 recipes you can make with your available ingredients', de: 'Hier sind 3 Rezepte, die du mit deinen vorhandenen Zutaten kochen kannst' },
  'fridge.usedIngredients': { en: 'Used ingredients:', de: 'Verwendete Zutaten:' },
  'fridge.missingIngredients': { en: 'Missing:', de: 'Fehlend:' },
  'fridge.moreIngredients': { en: '{count} more', de: '{count} weitere' },
  'fridge.likes': { en: '{count} likes', de: '{count} Likes' },
  'fridge.viewRecipe': { en: 'View Recipe', de: 'Rezept ansehen' },
  'recipe.markAsCooked': { en: 'Mark as Cooked', de: 'Als gekocht markieren' },
  'recipe.markingAsCooked': { en: 'Marking...', de: 'Wird markiert...' },
  'recipe.markedAsCooked': { en: 'Recipe marked as cooked! The AI will learn from this.', de: 'Rezept als gekocht markiert! Die KI lernt daraus.' },
  'recipe.markedAsCookedFailed': { en: 'Failed to mark recipe as cooked', de: 'Rezept konnte nicht als gekocht markiert werden' },
  'recipe.details': { en: 'Recipe Details', de: 'Rezept-Details' },
  'recipe.ingredients': { en: 'Ingredients', de: 'Zutaten' },
  'recipe.instructions': { en: 'Instructions', de: 'Anleitung' },
  'recipe.nutrition': { en: 'Nutrition (per serving)', de: 'Nährwerte (pro Portion)' },
  'recipe.close': { en: 'Close', de: 'Schließen' },
  'recipe.loading': { en: 'Loading recipe details...', de: 'Rezept-Details werden geladen...' },
  'recipe.noDetails': { en: 'No recipe details available', de: 'Keine Rezept-Details verfügbar' },
  'recipe.translating': { en: 'Translating...', de: 'Übersetze...' },
  'recipes.title': { en: 'Recipes', de: 'Rezepte' },
  'recipes.subtitle': { en: 'Your saved recipe suggestions', de: 'Deine gespeicherten Rezeptvorschläge' },
  'recipes.noRecipes': { en: 'No recipes saved yet', de: 'Noch keine Rezepte gespeichert' },
  'recipes.noRecipesDescription': { en: 'Analyze a fridge photo to get recipe suggestions that will be saved here', de: 'Analysiere ein Kühlschrank-Foto, um Rezeptvorschläge zu erhalten, die hier gespeichert werden' },
  'recipes.cooked': { en: 'Cooked', de: 'Gekocht' },
  'recipes.notCooked': { en: 'Not cooked yet', de: 'Noch nicht gekocht' },
  'recipes.delete': { en: 'Delete', de: 'Löschen' },
  'recipes.deleteConfirm': { en: 'Are you sure you want to delete this recipe?', de: 'Möchtest du dieses Rezept wirklich löschen?' },
  'recipes.deleted': { en: 'Recipe deleted successfully', de: 'Rezept erfolgreich gelöscht' },
  'recipes.deleteFailed': { en: 'Failed to delete recipe', de: 'Rezept konnte nicht gelöscht werden' },

  // Shopping List
  'shoppingList.title': { en: 'Shopping List', de: 'Einkaufsliste' },
  'shoppingList.addItem': { en: 'Add Item', de: 'Artikel hinzufügen' },
  'shoppingList.itemName': { en: 'Item Name', de: 'Artikelname' },
  'shoppingList.itemNamePlaceholder': { en: 'Enter item name', de: 'Artikelname eingeben' },
  'shoppingList.quantity': { en: 'Quantity', de: 'Menge' },
  'shoppingList.cancel': { en: 'Cancel', de: 'Abbrechen' },
  'shoppingList.add': { en: 'Add', de: 'Hinzufügen' },
  'shoppingList.adding': { en: 'Adding...', de: 'Hinzufügen...' },
  'shoppingList.itemAdded': { en: 'Item added successfully!', de: 'Artikel erfolgreich hinzugefügt!' },
  'shoppingList.failedToAdd': { en: 'Failed to add item', de: 'Artikel konnte nicht hinzugefügt werden' },
  'shoppingList.rename': { en: 'Rename List', de: 'Liste umbenennen' },
  'shoppingList.listName': { en: 'List Name', de: 'Listenname' },
  'shoppingList.listNamePlaceholder': { en: 'Enter list name', de: 'Listenname eingeben' },
  'shoppingList.save': { en: 'Save', de: 'Speichern' },
  'shoppingList.saving': { en: 'Saving...', de: 'Speichern...' },
  'shoppingList.listRenamed': { en: 'List renamed successfully!', de: 'Liste erfolgreich umbenannt!' },
  'shoppingList.delete': { en: 'Delete List', de: 'Liste löschen' },
  'shoppingList.deleteConfirm': { en: 'Are you sure you want to delete this shopping list?', de: 'Möchtest du diese Einkaufsliste wirklich löschen?' },
  'shoppingList.listDeleted': { en: 'Shopping list deleted successfully!', de: 'Einkaufsliste erfolgreich gelöscht!' },
  'shoppingList.generateFromLowStock': { en: 'Generate from Low Stock', de: 'Aus niedrigem Bestand generieren' },
  'shoppingList.generating': { en: 'Generating...', de: 'Generiere...' },
  'shoppingList.completeList': { en: 'Complete List', de: 'Liste abschließen' },
  'shoppingList.completeConfirm': { en: 'Are you sure you want to complete this shopping list? This will update your inventory.', de: 'Möchtest du diese Einkaufsliste wirklich abschließen? Dies wird dein Inventar aktualisieren.' },
  'shoppingList.completed': { en: 'Completed', de: 'Abgeschlossen' },
  'shoppingList.items': { en: 'items', de: 'Artikel' },
  'shoppingList.noItems': { en: 'No items in this list', de: 'Keine Artikel in dieser Liste' },
  'shoppingList.noListsYet': { en: 'No shopping lists yet', de: 'Noch keine Einkaufslisten' },
  'shoppingList.generateDescription': { en: 'Generate a shopping list from items below their stock threshold', de: 'Generiere eine Einkaufsliste aus Artikeln unter ihrem Bestandsschwellenwert' },

  // Common
  'common.loading': { en: 'Loading...', de: 'Laden...' },
  'common.search': { en: 'Search groceries...', de: 'Lebensmittel suchen...' },
  'common.filterCategory': { en: 'Filter by category', de: 'Nach Kategorie filtern' },
  'common.allCategories': { en: 'All Categories', de: 'Alle Kategorien' },
  'common.language': { en: 'Language', de: 'Sprache' },
  'common.loginSuccess': { en: 'Login successful!', de: 'Anmeldung erfolgreich!' },
  'common.loginFailed': { en: 'Login failed', de: 'Anmeldung fehlgeschlagen' },
  'common.invalidCredentials': { en: 'Invalid credentials', de: 'Ungültige Anmeldedaten' },
  'common.registrationSuccess': { en: 'Registration successful! Please sign in.', de: 'Registrierung erfolgreich! Bitte anmelden.' },
  'common.registrationFailed': { en: 'Registration failed', de: 'Registrierung fehlgeschlagen' },
  'common.noGroceriesFound': { en: 'No groceries found', de: 'Keine Lebensmittel gefunden' },
  'common.loadingGroceries': { en: 'Loading groceries...', de: 'Lade Lebensmittel...' },
  'common.expired': { en: 'Expired', de: 'Abgelaufen' },
  'common.expiresSoon': { en: 'Expires Soon', de: 'Läuft bald ab' },
  'common.noDate': { en: 'No Date', de: 'Kein Datum' },
  'common.good': { en: 'Good', de: 'Gut' },
  'common.lowStock': { en: 'Low Stock', de: 'Niedriger Bestand' },
  'common.inStock': { en: 'In Stock', de: 'Auf Lager' },
  
  // Categories
  'category.dairy': { en: 'Dairy', de: 'Milchprodukte' },
  'category.produce': { en: 'Produce', de: 'Obst & Gemüse' },
  'category.meat': { en: 'Meat', de: 'Fleisch' },
  'category.bakery': { en: 'Bakery', de: 'Backwaren' },
  'category.pantry': { en: 'Pantry', de: 'Vorrat' },
  'category.frozen': { en: 'Frozen', de: 'Tiefkühl' },
  'category.beverages': { en: 'Beverages', de: 'Getränke' },
  'category.snacks': { en: 'Snacks', de: 'Snacks' },
  'category.other': { en: 'Other', de: 'Sonstiges' },
};

let currentLocale: Locale = (typeof window !== 'undefined' && (localStorage.getItem('locale') as Locale)) || 'en';

export const i18n = {
  getLocale: (): Locale => currentLocale,
  
  setLocale: (locale: Locale) => {
    currentLocale = locale;
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
      window.dispatchEvent(new Event('localechange'));
    }
  },
  
  t: (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[currentLocale] || translation.en;
  },
};

// Initialize from localStorage on client
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('locale') as Locale;
  if (saved && (saved === 'en' || saved === 'de')) {
    currentLocale = saved;
  }
}

