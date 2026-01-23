import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeftRight } from 'lucide-react';
import { auth } from '@/lib/auth';
import { useI18n } from '@/hooks/use-i18n';

export function AdminSwitch() {
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSwitch = async () => {
    if (!userId || isNaN(parseInt(userId))) {
      toast.error(t('admin.enterValidId'));
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
      
      toast.success(t('admin.switchedSuccess'));
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('admin.switchError'));
      console.error('Switch user error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">{t('admin.userIdLabel')}</Label>
        <Input
          id="userId"
          type="number"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder={t('admin.userIdPlaceholder')}
          disabled={isLoading}
        />
      </div>
      <Button 
        onClick={handleSwitch} 
        disabled={isLoading || !userId}
        className="w-full"
      >
        <ArrowLeftRight className="mr-2 h-4 w-4" />
        {isLoading ? t('admin.switching') : t('admin.switchToUserButton')}
      </Button>
    </div>
  );
}

