-- AlterTable: Füge Tier-Limits und Tracking-Felder zur User-Tabelle hinzu
-- Verwende DO-Block für bessere Fehlerbehandlung bei bereits existierenden Spalten

DO $$ 
BEGIN
  -- Füge nullable Spalten hinzu (mit Default-Werten)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'maxCacheRecipeSuggestions') THEN
    ALTER TABLE "User" ADD COLUMN "maxCacheRecipeSuggestions" INTEGER DEFAULT 12;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'maxChatMessages') THEN
    ALTER TABLE "User" ADD COLUMN "maxChatMessages" INTEGER DEFAULT 4;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'maxCacheRecipeSearchViaChat') THEN
    ALTER TABLE "User" ADD COLUMN "maxCacheRecipeSearchViaChat" INTEGER DEFAULT 4;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'maxGroceriesWithExpiry') THEN
    ALTER TABLE "User" ADD COLUMN "maxGroceriesWithExpiry" INTEGER DEFAULT 10;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'maxGroceriesTotal') THEN
    ALTER TABLE "User" ADD COLUMN "maxGroceriesTotal" INTEGER DEFAULT 20;
  END IF;
  
  -- Füge NOT NULL Spalten hinzu (mit Default-Werten)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'notificationsEnabled') THEN
    ALTER TABLE "User" ADD COLUMN "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'hasPrioritySupport') THEN
    ALTER TABLE "User" ADD COLUMN "hasPrioritySupport" BOOLEAN NOT NULL DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'cacheRecipeSuggestionsUsed') THEN
    ALTER TABLE "User" ADD COLUMN "cacheRecipeSuggestionsUsed" INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'chatMessagesUsed') THEN
    ALTER TABLE "User" ADD COLUMN "chatMessagesUsed" INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'cacheRecipeSearchViaChatUsed') THEN
    ALTER TABLE "User" ADD COLUMN "cacheRecipeSearchViaChatUsed" INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'monthlyLimitResetAt') THEN
    ALTER TABLE "User" ADD COLUMN "monthlyLimitResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Setze monthlyLimitResetAt für bestehende User auf createdAt, falls NULL
UPDATE "User" SET "monthlyLimitResetAt" = "createdAt" WHERE "monthlyLimitResetAt" IS NULL;


