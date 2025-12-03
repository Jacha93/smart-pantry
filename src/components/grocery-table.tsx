'use client';

import { useState, useEffect } from 'react';
import { format, isBefore, addDays } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search } from 'lucide-react';
import { Grocery, GROCERY_CATEGORIES } from '@/types';
import { groceriesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';

interface GroceryTableProps {
  onGroceryUpdated: () => void;
}

export function GroceryTable({ onGroceryUpdated }: GroceryTableProps) {
  const { t } = useI18n();
  const [groceries, setGroceries] = useState<Grocery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Helper function to translate category names
  const translateCategory = (category: string): string => {
    const categoryKey = `category.${category.toLowerCase()}`;
    return t(categoryKey) || category;
  };

  useEffect(() => {
    fetchGroceries();
  }, []);

  const fetchGroceries = async () => {
    try {
      const response = await groceriesAPI.getAll();
      // Debug: Logge die komplette Response
      console.log('Groceries API Response:', {
        status: response.status,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      });
      
      // Stelle sicher, dass response.data ein Array ist
      if (Array.isArray(response.data)) {
        setGroceries(response.data);
      } else {
        console.error('Invalid response data:', {
          data: response.data,
          type: typeof response.data,
          constructor: response.data?.constructor?.name,
          response: response,
        });
        setGroceries([]);
        toast.error(t('groceries.failedToFetch'));
      }
    } catch (error) {
      console.error('Error fetching groceries:', {
        error,
        message: (error as any)?.message,
        response: (error as any)?.response,
        data: (error as any)?.response?.data,
      });
      setGroceries([]); // Stelle sicher, dass groceries immer ein Array ist
      toast.error(t('groceries.failedToFetch'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('groceries.deleteConfirm'))) return;
    
    try {
      await groceriesAPI.delete(id);
      toast.success(t('groceries.deletedSuccess'));
      onGroceryUpdated();
      fetchGroceries();
    } catch {
      toast.error(t('groceries.failedToDelete'));
    }
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'no-date';
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);
    
    if (isBefore(expiry, today)) return 'expired';
    if (isBefore(expiry, threeDaysFromNow)) return 'expiring-soon';
    return 'good';
  };

  const getExpiryBadge = (expiryDate?: string) => {
    const status = getExpiryStatus(expiryDate);
    
    switch (status) {
      case 'expired':
        return <Badge variant="destructive">{t('common.expired')}</Badge>;
      case 'expiring-soon':
        return <Badge variant="secondary">{t('common.expiresSoon')}</Badge>;
      case 'no-date':
        return <Badge variant="outline">{t('common.noDate')}</Badge>;
      default:
        return <Badge variant="default">{t('common.good')}</Badge>;
    }
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity <= threshold) {
      return <Badge variant="destructive">{t('common.lowStock')}</Badge>;
    }
    return <Badge variant="default">{t('common.inStock')}</Badge>;
  };

  const filteredGroceries = groceries.filter((grocery) => {
    const matchesSearch = grocery.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || grocery.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">{t('common.loadingGroceries')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('common.filterCategory')} />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="all">{t('common.allCategories')}</SelectItem>
            {GROCERY_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {translateCategory(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroceries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {t('common.noGroceriesFound')}
                </TableCell>
              </TableRow>
            ) : (
              filteredGroceries.map((grocery) => (
                <TableRow key={grocery.id}>
                  <TableCell className="font-medium">{grocery.name}</TableCell>
                  <TableCell>
                    {grocery.quantity} {grocery.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{translateCategory(grocery.category)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {grocery.expiry_date ? (
                        <div className="text-sm">
                          {format(new Date(grocery.expiry_date), 'MMM dd, yyyy')}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">{t('common.noDate')}</div>
                      )}
                      {getExpiryBadge(grocery.expiry_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStockStatus(grocery.quantity, grocery.low_stock_threshold)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(grocery.added_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.info(t('groceries.editComingSoon'));
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(grocery.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
