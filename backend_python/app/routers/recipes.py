from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.database import get_session
from app.models import User, SavedRecipe, Grocery, CookedRecipe
from app.schemas import SavedRecipeCreate, SavedRecipeRead
from app.dependencies import get_current_user

router = APIRouter(prefix="/recipes", tags=["recipes"])

def normalize_ingredient_name(name: str) -> str:
    """Normalisiert Zutatenname für Vergleich (lowercase, strip)"""
    return name.lower().strip()

def recipe_matches_inventory(recipe: SavedRecipe, inventory_names: List[str]) -> Dict[str, Any]:
    """Prüft ob ein Rezept mit dem Inventar übereinstimmt und gibt Match-Info zurück"""
    if not recipe.usedIngredients:
        return {"matches": False, "match_score": 0, "matched_ingredients": []}
    
    # Normalisiere Inventar-Namen
    inventory_normalized = {normalize_ingredient_name(name) for name in inventory_names}
    
    # Extrahiere Zutatennamen aus usedIngredients
    used_ingredient_names = []
    if isinstance(recipe.usedIngredients, list):
        for ing in recipe.usedIngredients:
            if isinstance(ing, dict):
                ing_name = ing.get("name", "")
            else:
                ing_name = str(ing)
            used_ingredient_names.append(normalize_ingredient_name(ing_name))
    
    # Berechne Match-Score (Anzahl übereinstimmender Zutaten)
    matched_ingredients = [name for name in used_ingredient_names if name in inventory_normalized]
    match_score = len(matched_ingredients)
    
    # Rezept passt, wenn mindestens 50% der used_ingredients im Inventar sind
    # oder wenn mindestens 2 Zutaten übereinstimmen
    matches = match_score >= max(1, len(used_ingredient_names) * 0.5) or match_score >= 2
    
    return {
        "matches": matches,
        "match_score": match_score,
        "matched_ingredients": matched_ingredients,
        "total_used_ingredients": len(used_ingredient_names)
    }

@router.get("")
async def get_saved_recipes(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    statement = select(SavedRecipe).where(SavedRecipe.userId == current_user.id)
    result = await session.execute(statement)
    recipes = result.scalars().all()
    
    # Prüfe welche Rezepte als "gekocht" markiert sind
    cooked_stmt = select(CookedRecipe.recipeId).where(CookedRecipe.userId == current_user.id)
    cooked_result = await session.execute(cooked_stmt)
    cooked_recipe_ids = {r for r in cooked_result.scalars().all()}
    
    # Bestimme "NEU" Status (Rezepte der letzten 7 Tage)
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    
    # Manually serialize with snake_case keys to match frontend expectations
    return [
        {
            "id": r.id,
            "user_id": r.userId,
            "recipe_id": r.recipeId,
            "title": r.title,
            "image": r.image,
            "used_ingredients": r.usedIngredients if r.usedIngredients else [],
            "missed_ingredients": r.missedIngredients if r.missedIngredients else [],
            "sourceUrl": r.sourceUrl,
            "ready_in_minutes": r.readyInMinutes,
            "servings": r.servings,
            "instructions": r.instructions,
            "ingredients_json": r.ingredientsJson,
            "saved_at": r.savedAt.isoformat() if r.savedAt else None,
            "likes": r.likes,
            "is_custom": r.isCustom,
            "is_cooked": r.recipeId in cooked_recipe_ids,
            "is_new": r.savedAt and r.savedAt >= seven_days_ago if r.savedAt else False
        }
        for r in recipes
    ]

@router.post("", response_model=SavedRecipeRead, status_code=status.HTTP_201_CREATED)
async def save_recipe(
    recipe_data: SavedRecipeCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    new_recipe = SavedRecipe(
        **recipe_data.dict(),
        userId=current_user.id
    )
    session.add(new_recipe)
    await session.commit()
    await session.refresh(new_recipe)
    return new_recipe

@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_recipe(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    statement = select(SavedRecipe).where(SavedRecipe.id == recipe_id, SavedRecipe.userId == current_user.id)
    result = await session.execute(statement)
    recipe = result.scalar_one_or_none()
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
            
    await session.delete(recipe)
    await session.commit()

@router.post("/suggest-from-inventory")
async def suggest_recipes_from_inventory(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Erstelle Rezeptvorschläge basierend auf dem aktuellen Inventar des Users"""
    # Lade User-Groceries
    groceries_stmt = select(Grocery).where(Grocery.userId == current_user.id)
    groceries_result = await session.execute(groceries_stmt)
    user_groceries = groceries_result.scalars().all()
    
    if not user_groceries:
        return {
            "new_recipes": [],
            "existing_matching_recipes": [],
            "ingredients_used": [],
            "message": "Keine Lebensmittel im Inventar gefunden"
        }
    
    ingredient_names = [g.name for g in user_groceries]
    
    # 1. Finde passende existierende Rezepte
    existing_recipes_stmt = select(SavedRecipe).where(SavedRecipe.userId == current_user.id)
    existing_recipes_result = await session.execute(existing_recipes_stmt)
    existing_recipes = existing_recipes_result.scalars().all()
    
    matching_existing = []
    for recipe in existing_recipes:
        match_info = recipe_matches_inventory(recipe, ingredient_names)
        if match_info["matches"]:
            # Serialisiere existierendes Rezept
            matching_existing.append({
                "id": recipe.id,
                "recipe_id": recipe.recipeId,
                "title": recipe.title,
                "image": recipe.image,
                "used_ingredients": recipe.usedIngredients if recipe.usedIngredients else [],
                "missed_ingredients": recipe.missedIngredients if recipe.missedIngredients else [],
                "likes": recipe.likes,
                "sourceUrl": recipe.sourceUrl,
                "ready_in_minutes": recipe.readyInMinutes,
                "servings": recipe.servings,
                "instructions": recipe.instructions,
                "saved_at": recipe.savedAt.isoformat() if recipe.savedAt else None,
                "is_custom": recipe.isCustom,
                "match_score": match_info["match_score"],
                "matched_ingredients": match_info["matched_ingredients"]
            })
    
    # Sortiere nach Match-Score (beste zuerst)
    matching_existing.sort(key=lambda x: x["match_score"], reverse=True)
    
    # 2. Hole neue Rezeptvorschläge (limit basierend auf Plan)
    # Bestimme Limit basierend auf User-Plan (vereinfacht: Free=3, Basic=5, Pro=10)
    plan_limit = 3  # Default
    if current_user.quotaLlmTokens == -1:  # Unlimited = Pro
        plan_limit = 10
    elif current_user.quotaRecipeCalls >= 15:  # Basic
        plan_limit = 5
    
    from app.routers.photo_recognition import get_recipe_suggestions, translate_text
    new_recipes_raw = await get_recipe_suggestions(ingredient_names, current_user.id, session)
    
    # Limit auf Plan-basierte Anzahl
    new_recipes_raw = new_recipes_raw[:plan_limit]
    
    # Auto-save recipes logic (ähnlich wie in analyze-fridge)
    saved_recipe_ids = []
    new_recipes = []
    
    # Translate and Save
    for recipe in new_recipes_raw:
        recipe_id = recipe.get("id")
        if not recipe_id: continue
        
        # Translate Title
        original_title = recipe.get("title", "Unnamed")
        translated_title = await translate_text(original_title, "de")
        recipe["title"] = translated_title  # Update for frontend response
        
        # Check if exists
        stmt = select(SavedRecipe).where(SavedRecipe.userId == current_user.id, SavedRecipe.recipeId == recipe_id)
        existing = (await session.execute(stmt)).scalar_one_or_none()
        
        if not existing:
            new_recipe = SavedRecipe(
                userId=current_user.id,
                recipeId=recipe_id,
                title=translated_title,
                image=recipe.get("image"),
                usedIngredients=recipe.get("usedIngredients"),
                missedIngredients=recipe.get("missedIngredients"),
                likes=recipe.get("likes", 0),
                sourceUrl=""
            )
            session.add(new_recipe)
            saved_recipe_ids.append(recipe_id)
            
            # Füge zu neuen Rezepten hinzu
            new_recipes.append({
                **recipe,
                "is_new": True
            })
        else:
            # Rezept existiert bereits, aber füge es trotzdem zu neuen hinzu (wenn es passt)
            new_recipes.append({
                **recipe,
                "is_new": False
            })
            
    if saved_recipe_ids:
        await session.commit()
    
    return {
        "new_recipes": new_recipes,
        "existing_matching_recipes": matching_existing,
        "ingredients_used": ingredient_names,
        "message": f"Rezeptvorschläge basierend auf {len(ingredient_names)} Lebensmitteln im Inventar"
    }