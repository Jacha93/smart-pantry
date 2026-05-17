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
        'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
        'hover:bg-[#17f6fe]/10 hover:text-[#17f6fe]',
        isActive
          ? 'bg-[#17f6fe]/12 text-[#17f6fe] font-semibold ring-1 ring-[#17f6fe]/20'
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
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-foreground/45">
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
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-[#0f0f13]">
      <div className="border-b border-white/10 p-4">
        <Link to="/app" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <img
            src="/smart-pantry-favicon.png"
            alt="Smart Pantry Icon"
            width={32}
            height={32}
            className="rounded-md ring-1 ring-[#17f6fe]/35"
          />
          <h1 className="text-xl font-bold text-foreground">{t('nav.appTitle')}</h1>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="mb-4">
          <NavItem icon={LayoutDashboard} to="/app" label="Dashboard" />
        </div>

        <div className="mx-3 my-4 h-px bg-gradient-to-r from-transparent via-[#a10dfd]/45 to-transparent" />

        <NavSection title="General">
          <NavItem icon={Package} to="/app/groceries" label={t('nav.groceries')} />
          <NavItem icon={ShoppingCart} to="/app/shopping-list" label={t('nav.shoppingList')} />
          <NavItem icon={ChefHat} to="/app/recipes" label={t('nav.recipes')} />
        </NavSection>

        <div className="mx-3 my-4 h-px bg-gradient-to-r from-transparent via-[#a10dfd]/45 to-transparent" />

        <NavSection title="Tools">
          <NavItem icon={Camera} to="/app/fridge-analyzer" label={t('nav.fridgeAnalyzer')} />
        </NavSection>
      </nav>

      <div className="border-t border-white/10 bg-white/[0.02] p-4">
        <UserProfileDropdown />
      </div>
    </aside>
  );
}
