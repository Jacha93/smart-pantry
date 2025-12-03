'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeftRight } from 'lucide-react';
import { auth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function AdminSwitch() {
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSwitch = async () => {
    if (!userId || isNaN(parseInt(userId))) {
      toast.error('Please enter a valid user ID');
      return;
    }

    try {
      setIsLoading(true);
      const response = await adminAPI.switchUser(parseInt(userId));
      const { access_token, refresh_token } = response.data;
      
      // Store new tokens
      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      toast.success('Switched to user account');
      router.refresh();
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to switch user');
      console.error('Switch user error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">User ID</Label>
        <Input
          id="userId"
          type="number"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID"
          disabled={isLoading}
        />
      </div>
      <Button 
        onClick={handleSwitch} 
        disabled={isLoading || !userId}
        className="w-full"
      >
        <ArrowLeftRight className="mr-2 h-4 w-4" />
        {isLoading ? 'Switching...' : 'Switch to User'}
      </Button>
    </div>
  );
}

