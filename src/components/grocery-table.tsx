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

interface GroceryTableProps {
  onGroceryUpdated: () => void;
}

export function GroceryTable({ onGroceryUpdated }: GroceryTableProps) {
  const [groceries, setGroceries] = useState<Grocery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchGroceries();
  }, []);

  const fetchGroceries = async () => {
    try {
      const response = await groceriesAPI.getAll();
      setGroceries(response.data);
    } catch {
      toast.error('Failed to fetch groceries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this grocery?')) return;
    
    try {
      await groceriesAPI.delete(id);
      toast.success('Grocery deleted successfully');
      onGroceryUpdated();
      fetchGroceries();
    } catch {
      toast.error('Failed to delete grocery');
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
        return <Badge variant="destructive">Expired</Badge>;
      case 'expiring-soon':
        return <Badge variant="secondary">Expires Soon</Badge>;
      case 'no-date':
        return <Badge variant="outline">No Date</Badge>;
      default:
        return <Badge variant="default">Good</Badge>;
    }
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity <= threshold) {
      return <Badge variant="destructive">Low Stock</Badge>;
    }
    return <Badge variant="default">In Stock</Badge>;
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
          <p className="mt-2">Loading groceries...</p>
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
            placeholder="Search groceries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[100]">
            <SelectItem value="all">All Categories</SelectItem>
            {GROCERY_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
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
                  No groceries found
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
                    <Badge variant="outline">{grocery.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {grocery.expiry_date ? (
                        <div className="text-sm">
                          {format(new Date(grocery.expiry_date), 'MMM dd, yyyy')}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">No date</div>
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
                          // TODO: Implement edit functionality
                          toast.info('Edit functionality coming soon');
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
