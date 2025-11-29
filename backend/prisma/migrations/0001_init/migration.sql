-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "encryptedProfile" TEXT,
    "quotaLlmTokens" INTEGER NOT NULL DEFAULT 15000,
    "quotaRecipeCalls" INTEGER NOT NULL DEFAULT 100,
    "llmTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "recipeCallsUsed" INTEGER NOT NULL DEFAULT 0,
    "quotaResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grocery" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lowStockThreshold" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "Grocery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" SERIAL NOT NULL,
    "listId" INTEGER NOT NULL,
    "groceryName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "checked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedRecipe" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT,
    "usedIngredients" JSONB,
    "missedIngredients" JSONB,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "sourceUrl" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "readyInMinutes" INTEGER,
    "servings" INTEGER,
    "instructions" TEXT,
    "ingredientsJson" JSONB,

    CONSTRAINT "SavedRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookedRecipe" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "recipeTitle" TEXT NOT NULL,
    "cookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER,

    CONSTRAINT "CookedRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grocery" ADD CONSTRAINT "Grocery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedRecipe" ADD CONSTRAINT "SavedRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CookedRecipe" ADD CONSTRAINT "CookedRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

