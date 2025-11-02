'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingCart, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { ShoppingList, ShoppingListItem } from '@/types';
import { shoppingListsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { AddShoppingListItemDialog } from '@/components/add-shopping-list-item-dialog';
import { RenameShoppingListDialog } from '@/components/rename-shopping-list-dialog';

export function ShoppingListView() {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    fetchShoppingLists();
  }, []);

  const fetchShoppingLists = async () => {
    try {
      const response = await shoppingListsAPI.getAll();
      setShoppingLists(response.data);
    } catch {
      toast.error('Failed to fetch shopping lists');
    } finally {
      setIsLoading(false);
    }
  };

  const generateShoppingList = async () => {
    setIsGenerating(true);
    try {
      await shoppingListsAPI.generate();
      toast.success('Shopping list generated from low stock items!');
      fetchShoppingLists();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || 'Failed to generate shopping list');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleItem = async (listId: number, itemId: number) => {
    try {
      await shoppingListsAPI.toggleItem(listId, itemId);
      fetchShoppingLists();
    } catch {
      toast.error('Failed to toggle item');
    }
  };

  const completeShoppingList = async (listId: number) => {
    if (!confirm(t('shoppingList.completeConfirm'))) return;
    
    try {
      await shoppingListsAPI.complete(listId);
      toast.success(t('shoppingList.completed'));
      fetchShoppingLists();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || 'Failed to complete shopping list');
    }
  };

  const deleteShoppingList = async (listId: number) => {
    if (!confirm(t('shoppingList.deleteConfirm'))) return;
    
    try {
      await shoppingListsAPI.delete(listId);
      toast.success(t('shoppingList.listDeleted'));
      fetchShoppingLists();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { detail?: string } } };
      toast.error(apiError.response?.data?.detail || 'Failed to delete shopping list');
    }
  };

  const getCheckedItemsCount = (items: ShoppingListItem[]) => {
    return items.filter(item => item.checked).length;
  };

  const getTotalItemsCount = (items: ShoppingListItem[]) => {
    return items.length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('shoppingList.title')}</h1>
          <p className="text-muted-foreground">Manage your shopping lists and track purchases</p>
        </div>
        <Button onClick={generateShoppingList} disabled={isGenerating}>
          <Plus className="h-4 w-4 mr-2" />
          {isGenerating ? t('shoppingList.generating') : t('shoppingList.generateFromLowStock')}
        </Button>
      </div>

      {shoppingLists.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t('shoppingList.noListsYet')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('shoppingList.generateDescription')}
            </p>
            <Button onClick={generateShoppingList} disabled={isGenerating}>
              <Plus className="h-4 w-4 mr-2" />
              {isGenerating ? t('shoppingList.generating') : t('shoppingList.generateFromLowStock')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shoppingLists.map((list) => (
            <Card key={list.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <ShoppingCart className="h-5 w-5" />
                      <span>{list.name || `Shopping List #${list.id}`}</span>
                      {list.completed && (
                        <Badge variant="default" className="ml-2">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t('shoppingList.completed')}
                        </Badge>
                      )}
                      <RenameShoppingListDialog list={list} onRenamed={fetchShoppingLists} />
                    </CardTitle>
                    <CardDescription>
                      Created on {format(new Date(list.created_at), 'MMM dd, yyyy')}
                    </CardDescription>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-sm text-muted-foreground">
                      {getCheckedItemsCount(list.items)} / {getTotalItemsCount(list.items)} {t('shoppingList.items')}
                    </div>
                    <div className="flex gap-2">
                      {list.completed && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteShoppingList(list.id)}
                          className="hover:scale-[1.02] active:scale-[0.98] transition-transform"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('shoppingList.delete')}
                        </Button>
                      )}
                      {!list.completed && (
                        <>
                          <AddShoppingListItemDialog listId={list.id} onItemAdded={fetchShoppingLists} />
                          <Button
                            size="sm"
                            onClick={() => completeShoppingList(list.id)}
                          >
                            {t('shoppingList.completeList')}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {list.items.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">{t('shoppingList.noItems')}</p>
                    {!list.completed && (
                      <AddShoppingListItemDialog listId={list.id} onItemAdded={fetchShoppingLists} />
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {list.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border glass-card ${
                          item.checked ? 'opacity-50 line-through' : ''
                        }`}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(list.id, item.id)}
                          disabled={list.completed}
                        />
                        <div className="flex-1">
                          <span className="font-medium text-foreground">{item.grocery_name}</span>
                          <span className="text-muted-foreground ml-2">({item.quantity} needed)</span>
                        </div>
                      </div>
                    ))}
                    {!list.completed && (
                      <div className="pt-2">
                        <AddShoppingListItemDialog listId={list.id} onItemAdded={fetchShoppingLists} />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
