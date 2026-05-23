from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlmodel import select
from app.models import User, Grocery
from app.schemas import UserProfile
from app.dependencies import get_current_user
from app.database import get_session

router = APIRouter(prefix="", tags=["users"]) # Prefix leer lassen wenn wir /me wollen, oder router.get("/me")

@router.get("/me", response_model=UserProfile)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    display_name = current_user.fullName or current_user.username or current_user.email

    # Bereite die Response vor (Quotas etc.)
    # Vereinfacht für jetzt:
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        name=display_name,
        role=current_user.role,
        createdAt=current_user.createdAt,
        fullName=current_user.fullName,
        username=current_user.username,
        quotas={
            "llm_tokens_total": current_user.quotaLlmTokens,
            "llm_tokens_used": current_user.llmTokensUsed,
            "recipe_calls_total": current_user.quotaRecipeCalls,
            "recipe_calls_used": current_user.recipeCallsUsed,
            "reset_at": current_user.quotaResetAt,
            "maxCacheRecipeSuggestions": current_user.maxCacheRecipeSuggestions,
            "maxChatMessages": current_user.maxChatMessages,
            "maxCacheRecipeSearchViaChat": current_user.maxCacheRecipeSearchViaChat,
            "maxGroceriesWithExpiry": current_user.maxGroceriesWithExpiry,
            "maxGroceriesTotal": current_user.maxGroceriesTotal,
            "cacheRecipeSuggestionsUsed": current_user.cacheRecipeSuggestionsUsed or 0,
            "chatMessagesUsed": current_user.chatMessagesUsed or 0,
            "cacheRecipeSearchViaChatUsed": current_user.cacheRecipeSearchViaChatUsed or 0,
            "hasPrioritySupport": current_user.hasPrioritySupport,
            "notificationsEnabled": current_user.notificationsEnabled
        }
    )

@router.get("/me/usage")
async def get_usage(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Counts
    total_groceries = (await session.execute(select(func.count()).select_from(Grocery).where(Grocery.userId == current_user.id))).scalar_one()
    
    groceries_with_expiry = (await session.execute(
        select(func.count()).select_from(Grocery).where(Grocery.userId == current_user.id, Grocery.expiryDate != None)
    )).scalar_one()

    return {
        "quotaLlmTokens": current_user.quotaLlmTokens,
        "quotaRecipeCalls": current_user.quotaRecipeCalls,
        "llmTokensUsed": current_user.llmTokensUsed,
        "recipeCallsUsed": current_user.recipeCallsUsed,
        "maxCacheRecipeSuggestions": current_user.maxCacheRecipeSuggestions,
        "maxChatMessages": current_user.maxChatMessages,
        "maxCacheRecipeSearchViaChat": current_user.maxCacheRecipeSearchViaChat,
        "maxGroceriesWithExpiry": current_user.maxGroceriesWithExpiry,
        "maxGroceriesTotal": current_user.maxGroceriesTotal,
        "notificationsEnabled": current_user.notificationsEnabled,
        "hasPrioritySupport": current_user.hasPrioritySupport,
        "currentGroceriesTotal": total_groceries,
        "currentGroceriesWithExpiry": groceries_with_expiry,
        "cacheRecipeSuggestionsUsed": current_user.cacheRecipeSuggestionsUsed or 0, # Handle None
        "chatMessagesUsed": current_user.chatMessagesUsed or 0,
        "cacheRecipeSearchViaChatUsed": current_user.cacheRecipeSearchViaChatUsed or 0,
        "quotaResetAt": current_user.quotaResetAt,
        "monthlyLimitResetAt": current_user.monthlyLimitResetAt or current_user.createdAt,
        "auth_disabled": False # Always false in prod/local dev now
    }

@router.get("/user/limits")
async def get_user_limits(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    return await get_usage(current_user, session)
