from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List

from app.database import get_session
from app.models import User, Grocery
from app.schemas import GroceryCreate, GroceryRead
from app.dependencies import get_current_user

router = APIRouter(prefix="/groceries", tags=["groceries"])

@router.get("", response_model=List[GroceryRead])
async def get_groceries(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    statement = select(Grocery).where(Grocery.userId == current_user.id)
    result = await session.execute(statement)
    return result.scalars().all()

@router.post("", response_model=GroceryRead, status_code=status.HTTP_201_CREATED)
async def create_grocery(
    grocery_data: GroceryCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Hier könnten wir noch Limits prüfen (siehe models.py maxGroceriesTotal)
    new_grocery = Grocery(
        **grocery_data.dict(),
        userId=current_user.id
    )
    session.add(new_grocery)
    await session.commit()
    await session.refresh(new_grocery)
    return new_grocery

@router.put("/{grocery_id}", response_model=GroceryRead)
async def update_grocery(
    grocery_id: int,
    grocery_data: GroceryCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    statement = select(Grocery).where(Grocery.id == grocery_id, Grocery.userId == current_user.id)
    result = await session.execute(statement)
    grocery = result.scalar_one_or_none()
    
    if not grocery:
        raise HTTPException(status_code=404, detail="Grocery not found")
        
    for key, value in grocery_data.dict(exclude_unset=True).items():
        setattr(grocery, key, value)
        
    session.add(grocery)
    await session.commit()
    await session.refresh(grocery)
    return grocery

@router.delete("/{grocery_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grocery(
    grocery_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    statement = select(Grocery).where(Grocery.id == grocery_id, Grocery.userId == current_user.id)
    result = await session.execute(statement)
    grocery = result.scalar_one_or_none()
    
    if not grocery:
        raise HTTPException(status_code=404, detail="Grocery not found")
        
    await session.delete(grocery)
    await session.commit()