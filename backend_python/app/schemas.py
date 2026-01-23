from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models import UserRole

# Login Request
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Token Response (passend zum Frontend)
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# User Registrierung
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

# User Response (ohne Passwort!)
class UserRead(BaseModel):
    id: int
    email: EmailStr
    # name: str # Removed
    role: UserRole
    createdAt: datetime

    class Config:
        from_attributes = True

# Profile Response (für /me)
class UserProfile(UserRead):
    fullName: Optional[str] = None
    username: Optional[str] = None
    name: Optional[str] = None # Legacy support for frontend
    quotas: dict  # Hier packen wir später die Quota-Infos rein

class GroceryBase(BaseModel):
    name: str
    quantity: float
    unit: str
    category: str
    expiryDate: Optional[datetime] = Field(default=None, alias="expiry_date")
    lowStockThreshold: float = Field(default=1.0, alias="low_stock_threshold")
    notes: Optional[str] = None

class GroceryCreate(GroceryBase):
    pass

class GroceryRead(GroceryBase):
    id: int
    userId: int = Field(alias="user_id")
    addedAt: datetime = Field(alias="added_date")

    class Config:
        from_attributes = True
        populate_by_name = True # Allow creating with alias or name, and serializing with alias

class SavedRecipeBase(BaseModel):
    recipeId: int
    title: str
    image: Optional[str] = None
    usedIngredients: Optional[dict] = None
    missedIngredients: Optional[dict] = None
    sourceUrl: Optional[str] = None
    readyInMinutes: Optional[int] = None
    servings: Optional[int] = None
    instructions: Optional[str] = None
    ingredientsJson: Optional[dict] = None

class SavedRecipeCreate(SavedRecipeBase):
    pass

class SavedRecipeRead(SavedRecipeBase):
    id: int
    userId: int
    savedAt: datetime
    likes: int
    isCustom: bool

    class Config:
        from_attributes = True

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class ShoppingListItemBase(BaseModel):
    name: str
    quantity: float
    unit: str
    checked: bool = False

class ShoppingListItemCreate(ShoppingListItemBase):
    pass

class ShoppingListItemRead(ShoppingListItemBase):
    id: int
    shoppingListId: int
    addedAt: datetime
    class Config:
        from_attributes = True

class ShoppingListBase(BaseModel):
    name: str

class ShoppingListCreate(ShoppingListBase):
    # Optional items beim Erstellen
    items: Optional[List[ShoppingListItemCreate]] = None

class ShoppingListRead(ShoppingListBase):
    id: int
    userId: int
    createdAt: datetime
    updatedAt: datetime
    items: List[ShoppingListItemRead] = []
    class Config:
        from_attributes = True
