from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from sqlmodel import select
from typing import List
from datetime import datetime

from app.database import get_session
from app.models import User, ShoppingList, ShoppingListItem
from app.schemas import ShoppingListCreate, ShoppingListRead, ShoppingListItemCreate, ShoppingListItemRead
from app.dependencies import get_current_user

router = APIRouter(prefix="/shopping-lists", tags=["shopping-lists"])

@router.get("", response_model=List[ShoppingListRead])
async def get_shopping_lists(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Eager loading wäre hier besser, aber wir machen es erst mal simpel
    statement = select(ShoppingList).where(ShoppingList.userId == current_user.id)
    result = await session.execute(statement)
    lists = result.scalars().all()
    
    # Items manuell nachladen (nicht performant, aber funktioniert)
    # TODO: In Zukunft mit strategy="selectin" lösen relationship
    response_lists = []
    for sl in lists:
        item_stmt = select(ShoppingListItem).where(ShoppingListItem.shoppingListId == sl.id)
        item_res = await session.execute(item_stmt)
        items = item_res.scalars().all()
        
        sl_dict = sl.dict()
        sl_dict["items"] = items
        response_lists.append(sl_dict)
        
    return response_lists

@router.post("/", response_model=ShoppingListRead, status_code=status.HTTP_201_CREATED)
async def create_shopping_list(
    list_data: ShoppingListCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    new_list = ShoppingList(
        name=list_data.name,
        userId=current_user.id
    )
    session.add(new_list)
    await session.commit()
    await session.refresh(new_list)
    
    # Items hinzufügen falls vorhanden
    created_items = []
    if list_data.items:
        for item in list_data.items:
            new_item = ShoppingListItem(
                **item.dict(),
                shoppingListId=new_list.id
            )
            session.add(new_item)
            created_items.append(new_item)
        await session.commit()
    
    # Response bauen
    response = new_list.dict()
    response["items"] = created_items
    return response

@router.post("/{list_id}/items", response_model=ShoppingListItemRead, status_code=status.HTTP_201_CREATED)
async def add_item_to_list(
    list_id: int,
    item_data: ShoppingListItemCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Check ob Liste existiert und User gehört
    stmt = select(ShoppingList).where(ShoppingList.id == list_id, ShoppingList.userId == current_user.id)
    res = await session.execute(stmt)
    sl = res.scalar_one_or_none()
    
    if not sl:
        raise HTTPException(status_code=404, detail="Shopping list not found")
        
    new_item = ShoppingListItem(
        **item_data.dict(),
        shoppingListId=list_id
    )
    session.add(new_item)
    await session.commit()
    await session.refresh(new_item)
    return new_item

@router.put("/{list_id}/items/{item_id}/toggle", response_model=ShoppingListItemRead)
async def toggle_item(
    list_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Validierung (Liste + Item owner check)
    stmt = select(ShoppingList).where(ShoppingList.id == list_id, ShoppingList.userId == current_user.id)
    if not (await session.execute(stmt)).scalar_one_or_none():
         raise HTTPException(status_code=404, detail="Shopping list not found")

    item_stmt = select(ShoppingListItem).where(ShoppingListItem.id == item_id, ShoppingListItem.shoppingListId == list_id)
    res = await session.execute(item_stmt)
    item = res.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    item.checked = not item.checked
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item

@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_list(
    list_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    stmt = select(ShoppingList).where(ShoppingList.id == list_id, ShoppingList.userId == current_user.id)
    res = await session.execute(stmt)
    sl = res.scalar_one_or_none()
    
    if not sl:
        raise HTTPException(status_code=404, detail="Shopping list not found")
        
    # Delete child items explicitly before removing the parent row.
    await session.execute(delete(ShoppingListItem).where(ShoppingListItem.shoppingListId == list_id))
    await session.delete(sl)
    await session.commit()
