from typing import Optional
from datetime import datetime
from sqlalchemy import Column
from sqlalchemy import Enum as SAEnum
from sqlmodel import SQLModel, Field, JSON
from enum import Enum

class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class User(SQLModel, table=True):
    __tablename__ = "User"  # WICHTIG: Supabase/Postgres ist case-sensitive, wenn in Anführungszeichen erstellt

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    # name: str  # Removed as not present in DB
    fullName: Optional[str] = None
    username: Optional[str] = Field(default=None, unique=True)
    passwordHash: str
    role: UserRole = Field(default=UserRole.USER, sa_column=Column(SAEnum(UserRole, name="UserRole")))
    
    # Profile & Quotas (Defaults aus schema.prisma)
    encryptedProfile: Optional[str] = None
    quotaLlmTokens: int = Field(default=5000)
    quotaRecipeCalls: int = Field(default=6)
    llmTokensUsed: int = Field(default=0)
    recipeCallsUsed: int = Field(default=0)
    
    # Tier Limits
    maxCacheRecipeSuggestions: Optional[int] = Field(default=12)
    maxChatMessages: Optional[int] = Field(default=4)
    maxCacheRecipeSearchViaChat: Optional[int] = Field(default=4)
    maxGroceriesWithExpiry: Optional[int] = Field(default=10)
    maxGroceriesTotal: Optional[int] = Field(default=20)
    
    # Monthly Usage Tracking
    cacheRecipeSuggestionsUsed: Optional[int] = Field(default=0)
    chatMessagesUsed: Optional[int] = Field(default=0)
    cacheRecipeSearchViaChatUsed: Optional[int] = Field(default=0)
    
    notificationsEnabled: bool = Field(default=False)
    hasPrioritySupport: bool = Field(default=False)
    
    # Reset Dates
    quotaResetAt: Optional[datetime] = None
    monthlyLimitResetAt: Optional[datetime] = None
    
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

class RefreshToken(SQLModel, table=True):
    __tablename__ = "RefreshToken"

    id: Optional[int] = Field(default=None, primary_key=True)
    tokenHash: str
    userId: int = Field(foreign_key="User.id")
    expiresAt: datetime
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    revokedAt: Optional[datetime] = None
    userAgent: Optional[str] = None
    ipAddress: Optional[str] = None

class Grocery(SQLModel, table=True):
    __tablename__ = "Grocery"

    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="User.id")
    name: str
    quantity: float
    unit: str
    category: str
    expiryDate: Optional[datetime] = None
    addedAt: datetime = Field(default_factory=datetime.utcnow)
    lowStockThreshold: float = Field(default=1.0)
    notes: Optional[str] = None

class SavedRecipe(SQLModel, table=True):
    __tablename__ = "SavedRecipe"
    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="User.id")
    recipeId: int
    title: str
    image: Optional[str] = None
    usedIngredients: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    missedIngredients: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    likes: int = Field(default=0)
    sourceUrl: Optional[str] = None
    savedAt: datetime = Field(default_factory=datetime.utcnow)
    isCustom: bool = Field(default=False)
    readyInMinutes: Optional[int] = None
    servings: Optional[int] = None
    instructions: Optional[str] = None
    ingredientsJson: Optional[dict] = Field(default=None, sa_column=Column(JSON))
class CookedRecipe(SQLModel, table=True):
    __tablename__ = "CookedRecipe"
    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="User.id")
    recipeId: int
    recipeTitle: str
    cookedAt: datetime = Field(default_factory=datetime.utcnow)
    rating: Optional[int] = None


class ShoppingList(SQLModel, table=True):
    __tablename__ = "ShoppingList"
    id: Optional[int] = Field(default=None, primary_key=True)
    userId: int = Field(foreign_key="User.id")
    name: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class ShoppingListItem(SQLModel, table=True):
    __tablename__ = "ShoppingListItem"
    id: Optional[int] = Field(default=None, primary_key=True)
    shoppingListId: int = Field(foreign_key="ShoppingList.id")
    name: str
    quantity: float
    unit: str
    checked: bool = Field(default=False)
    addedAt: datetime = Field(default_factory=datetime.utcnow)
