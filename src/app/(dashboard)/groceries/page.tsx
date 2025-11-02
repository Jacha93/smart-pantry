'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddGroceryDialog } from '@/components/add-grocery-dialog';
import { GroceryTable } from '@/components/grocery-table';
import { useI18n } from '@/hooks/use-i18n';

export default function GroceriesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { t } = useI18n();

  const handleGroceryAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleGroceryUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('groceries.title')}</h1>
          <p className="text-muted-foreground">{t('groceries.subtitle')}</p>
        </div>
        <AddGroceryDialog onGroceryAdded={handleGroceryAdded} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('groceries.inventory')}</CardTitle>
          <CardDescription>
            {t('groceries.inventoryDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GroceryTable key={refreshKey} onGroceryUpdated={handleGroceryUpdated} />
        </CardContent>
      </Card>
    </div>
  );
}
