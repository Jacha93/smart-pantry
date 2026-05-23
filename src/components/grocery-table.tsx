'use client';

import { useState, useEffect } from 'react';
import { format, isBefore, addDays } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { Grocery, GROCERY_CATEGORIES } from '@/types';
import { groceriesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { EditGroceryDialog } from '@/components/edit-grocery-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MotionTableRow = motion.create(TableRow);

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
      setIsLoading(true);
      const response = await groceriesAPI.getAll();
      
      // Debug: Logge die komplette Response
      console.log('[GroceryTable] API Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        headers: response.headers,
      });
      
      // Prüfe Status-Code
      if (response.status === 401) {
        console.error('[GroceryTable] 401 Unauthorized - Token invalid or missing');
        setGroceries([]);
        toast.error('Nicht authentifiziert. Bitte melde dich erneut an.');
        return;
      }
      
      // Prüfe ob es eine Fehler-Response ist (z.B. {detail: 'Invalid token'})
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && 'detail' in response.data) {
        console.error('[GroceryTable] API returned error:', response.data.detail);
        setGroceries([]);
        // Prüfe ob es ein Auth-Fehler ist
        if (response.data.detail && typeof response.data.detail === 'string' && 
            (response.data.detail.includes('token') || response.data.detail.includes('authenticated'))) {
          toast.error('Authentifizierungsfehler. Bitte melde dich erneut an.');
        } else {
          toast.error(response.data.detail || t('groceries.failedToFetch'));
        }
        return;
      }
      
      // Stelle sicher, dass response.data ein Array ist
      if (Array.isArray(response.data)) {
        console.log('[GroceryTable] Successfully loaded groceries:', response.data.length);
        setGroceries(response.data);
      } else {
        console.error('[GroceryTable] Invalid response data:', {
          data: response.data,
          type: typeof response.data,
          constructor: response.data?.constructor?.name,
          response: response,
        });
        setGroceries([]);
        toast.error(t('groceries.failedToFetch'));
      }
    } catch (error: any) {
      console.error('[GroceryTable] Error fetching groceries:', {
        error,
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      
      // Prüfe ob es ein 401-Fehler ist
      if (error?.response?.status === 401) {
        console.error('[GroceryTable] 401 Unauthorized in catch block');
        toast.error('Nicht authentifiziert. Bitte melde dich erneut an.');
      } else {
        toast.error(t('groceries.failedToFetch'));
      }
      
      setGroceries([]); // Stelle sicher, dass groceries immer ein Array ist
    } finally {
      setIsLoading(false);
    }
  };

  const [editingGrocery, setEditingGrocery] = useState<Grocery | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groceryToDelete, setGroceryToDelete] = useState<Grocery | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteConfirm = (grocery: Grocery) => {
    setGroceryToDelete(grocery);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!groceryToDelete) return;
    
    setIsDeleting(true);
    try {
      await groceriesAPI.delete(groceryToDelete.id);
      toast.success(t('groceries.deletedSuccess'));
      onGroceryUpdated();
      fetchGroceries();
    } catch {
      toast.error(t('groceries.failedToDelete'));
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setGroceryToDelete(null);
    }
  };

  const handleEdit = (grocery: Grocery) => {
    setEditingGrocery(grocery);
  };

  // ... (getExpiryStatus, etc.)

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
    return <Badge variant="secondary">{t('common.inStock')}</Badge>;
  };

  const filteredGroceries = groceries.filter((grocery) => {
    const matchesSearch = grocery.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || grocery.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-2 md:space-y-4">
      <div className="flex flex-col sm:flex-row gap-1.5 md:gap-4">
         <div className="relative flex-1">
           <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 md:h-4 md:w-4" />
           <Input
             placeholder={t('common.search')}
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="pl-7 md:pl-10 h-8 md:h-10 text-xs md:text-sm"
           />
         </div>
         <Select value={categoryFilter} onValueChange={setCategoryFilter}>
           <SelectTrigger className="w-full sm:w-48 h-8 md:h-10 text-xs md:text-sm">
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

      {/* Desktop: Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('groceries.name')}</TableHead>
              <TableHead>{t('groceries.quantity')}</TableHead>
              <TableHead>{t('groceries.category')}</TableHead>
              <TableHead>{t('groceries.expiry')}</TableHead>
              <TableHead>{t('common.stock')}</TableHead>
              <TableHead>{t('common.added')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
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
              <AnimatePresence mode='popLayout'>
                {filteredGroceries.map((grocery, index) => (
                  <MotionTableRow 
                    key={grocery.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.012, 0.12) }}
                    className="group hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">{grocery.name}</TableCell>
                    <TableCell>
                      {grocery.quantity} {grocery.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {translateCategory(grocery.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {grocery.expiry_date && (
                          <div className="text-sm">
                            {format(new Date(grocery.expiry_date), 'MMM dd, yyyy')}
                          </div>
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
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:-translate-y-0.5 hover:text-[#17f6fe] hover:bg-[#17f6fe]/15 transition-all duration-200"
                          onClick={() => handleEdit(grocery)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:-translate-y-0.5 hover:text-red-500 hover:bg-red-500/15 transition-all duration-200"
                          onClick={() => openDeleteConfirm(grocery)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </MotionTableRow>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-2">
        {filteredGroceries.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-500">
            {t('common.noGroceriesFound')}
          </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {filteredGroceries.map((grocery, index) => (
              <motion.div
                key={grocery.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.012, 0.12) }}
              >
                <Card>
                  <CardContent className="p-2">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-tight">{grocery.name}</h3>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {grocery.quantity} {grocery.unit}
                          </p>
                        </div>
                        <div className="flex space-x-0.5 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-[#17f6fe] hover:bg-[#17f6fe]/15"
                            onClick={() => handleEdit(grocery)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/15"
                            onClick={() => openDeleteConfirm(grocery)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="default" className="text-[10px] px-1 py-0 leading-tight">
                          {translateCategory(grocery.category)}
                        </Badge>
                        <div className="[&>span]:text-[10px] [&>span]:px-1 [&>span]:py-0 [&>span]:leading-tight">
                          {getExpiryBadge(grocery.expiry_date)}
                        </div>
                        <div className="[&>span]:text-[10px] [&>span]:px-1 [&>span]:py-0 [&>span]:leading-tight">
                          {getStockStatus(grocery.quantity, grocery.low_stock_threshold)}
                        </div>
                      </div>
                      
                      {grocery.expiry_date && (
                        <div className="text-[10px] text-muted-foreground">
                          {t('groceries.expiry')}: {format(new Date(grocery.expiry_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                      
                      <div className="text-[10px] text-muted-foreground">
                        {t('common.added')}: {format(new Date(grocery.added_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <EditGroceryDialog 
        open={!!editingGrocery} 
        onOpenChange={(open) => !open && setEditingGrocery(null)}
        onSuccess={() => {
          onGroceryUpdated();
          fetchGroceries();
        }}
        grocery={editingGrocery}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('groceries.deleteTitle') || 'Artikel löschen?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('groceries.deleteConfirmMessage', { name: groceryToDelete?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel') || 'Abbrechen'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} disabled={isDeleting}>
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.deleting') || 'Löschen...'}</>
              ) : (
                t('common.delete') || 'Löschen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
