-- AlterTable: Füge fullName und username zur User-Tabelle hinzu
-- Migriere bestehende name-Werte zu fullName

DO $$ 
BEGIN
  -- Füge fullName Spalte hinzu (nullable)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'fullName') THEN
    ALTER TABLE "User" ADD COLUMN "fullName" TEXT;
  END IF;
  
  -- Füge username Spalte hinzu (nullable, unique)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'username') THEN
    ALTER TABLE "User" ADD COLUMN "username" TEXT;
    -- Erstelle unique index für username (nur für nicht-NULL Werte)
    CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username") WHERE "username" IS NOT NULL;
  END IF;
END $$;

-- Migriere bestehende name-Werte zu fullName
UPDATE "User" SET "fullName" = "name" WHERE "fullName" IS NULL AND "name" IS NOT NULL;

