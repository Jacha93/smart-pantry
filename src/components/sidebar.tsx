import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Camera, 
  ChefHat
} from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';
import { UserProfileDropdown } from './user-profile-dropdown';

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  label: string;
}

function NavItem({ icon: Icon, to, label }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/app' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center space-x-3 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
        'hover:bg-[#17f6fe]/10 hover:text-[#17f6fe]',
        isActive
          ? 'bg-[#17f6fe]/15 text-[#17f6fe] font-semibold border-l-2 border-[#17f6fe]'
          : 'text-foreground/90'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

interface NavSectionProps {
  title?: string;
  children: React.ReactNode;
}

function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="space-y-1 mb-4">
      {title && (
        <h3 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider px-3 mb-2">
          {title}
        </h3>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function Sidebar() {
  const { t } = useI18n();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#18181b] border-r border-white/10 flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <Link to="/app" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <img
            src="/smart-pantry-favicon.png"
            alt="Smart Pantry Icon"
            width={32}
            height={32}
            className="rounded-lg shadow-[0_0_25px_rgba(23,246,254,0.35)]"
          />
          <h1 className="text-xl font-bold text-foreground">{t('nav.appTitle')}</h1>
        </Link>
      </div>

      {/* Main Navigation - Flex-Grow, Scrollbar */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {/* Dashboard - Alleine oberhalb */}
        <div className="mb-4">
          <NavItem icon={LayoutDashboard} to="/app" label="Dashboard" />
        </div>

        {/* Trennstrich */}
        <div className="flex items-center px-6 my-4">
          <div className="flex-1 h-px bg-[#a10dfd]/30"></div>
          <div className="w-8 h-px bg-[#a10dfd]"></div>
          <div className="flex-1 h-px bg-[#a10dfd]/30"></div>
        </div>

        {/* General Section */}
        <NavSection title="General">
          <NavItem icon={Package} to="/app/groceries" label={t('nav.groceries')} />
          <NavItem icon={ShoppingCart} to="/app/shopping-list" label={t('nav.shoppingList')} />
          <NavItem icon={ChefHat} to="/app/recipes" label={t('nav.recipes')} />
        </NavSection>

        {/* Trennstrich */}
        <div className="flex items-center px-6 my-4">
          <div className="flex-1 h-px bg-[#a10dfd]/30"></div>
          <div className="w-8 h-px bg-[#a10dfd]"></div>
          <div className="flex-1 h-px bg-[#a10dfd]/30"></div>
        </div>

        {/* Tools Section */}
        <NavSection title="Tools">
          <NavItem icon={Camera} to="/app/fridge-analyzer" label={t('nav.fridgeAnalyzer')} />
        </NavSection>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <UserProfileDropdown />
      </div>
    </aside>
  );
}
