import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import { profileAPI } from '@/lib/api';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

interface UserData {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await profileAPI.get();
        if (response.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    console.log('[UserProfileDropdown] Logout button clicked');
    setIsOpen(false);
    
    // Warte auf Logout
    await auth.logout();
    
    // Verifiziere, dass Token gelöscht sind
    const stillAuthenticated = auth.isAuthenticated();
    if (stillAuthenticated) {
      console.error('[UserProfileDropdown] Still authenticated after logout! Force removing tokens...');
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      window.dispatchEvent(new Event('authchange'));
    }
    
    console.log('[UserProfileDropdown] Navigating to landing page...');
    
    // Navigiere zu Landing Page mit Hard-Refresh
    window.location.href = '/';
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.name || user?.email || 'User';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center space-x-3 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
            'hover:bg-[#17f6fe]/10 hover:text-[#17f6fe] text-foreground/90'
          )}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#17f6fe]/20 flex items-center justify-center text-[#17f6fe] font-semibold text-xs">
            {isLoading ? (
              <User className="h-4 w-4" />
            ) : (
              getUserInitials(displayName)
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="truncate font-medium">{displayName}</div>
            <div className="truncate text-xs text-foreground/60">{user?.email}</div>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={8}
        className="w-56 p-2 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=open]:duration-150 data-[state=closed]:duration-150"
      >
        <div className="space-y-1">
          <Link
            to="/app/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm hover:bg-[#17f6fe]/10 hover:text-[#17f6fe] transition-colors text-foreground/90"
          >
            <User className="h-4 w-4" />
            <span>{t('nav.profile')}</span>
          </Link>
          <div className="border-t border-white/10 my-1" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm hover:bg-red-500/10 hover:text-red-400 transition-colors text-foreground/90"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
