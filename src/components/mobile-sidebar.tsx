import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Camera, 
  ChefHat,
  Menu,
  X
} from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';
import { UserProfileDropdown } from './user-profile-dropdown';

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  label: string;
  onClick?: () => void;
}

function NavItem({ icon: Icon, to, label, onClick }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/app' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
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

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-md border border-white/10 bg-[#0f0f13] p-2 text-foreground transition-colors hover:bg-[#17f6fe]/10 hover:text-[#17f6fe] md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm md:hidden animate-in fade-in-0 duration-150"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-64 transform flex-col border-r border-white/10 bg-[#0f0f13] shadow-[18px_0_48px_rgba(0,0,0,0.35)] transition-transform duration-[250ms] ease-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link to="/app" className="flex items-center space-x-3 hover:opacity-80 transition-opacity" onClick={closeSidebar}>
            <img
              src="/smart-pantry-favicon.png"
              alt="Smart Pantry Icon"
              width={32}
              height={32}
              className="rounded-md ring-1 ring-[#17f6fe]/35"
            />
            <h1 className="text-xl font-bold text-foreground">{t('nav.appTitle')}</h1>
          </Link>
          <button
            onClick={closeSidebar}
            className="rounded-md p-2 text-foreground transition-colors hover:bg-[#17f6fe]/10 hover:text-[#17f6fe]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="mb-4">
            <NavItem icon={LayoutDashboard} to="/app" label="Dashboard" onClick={closeSidebar} />
          </div>

          <div className="mx-3 my-4 h-px bg-gradient-to-r from-transparent via-[#a10dfd]/45 to-transparent" />

          <NavSection title="General">
            <NavItem icon={Package} to="/app/groceries" label={t('nav.groceries')} onClick={closeSidebar} />
            <NavItem icon={ShoppingCart} to="/app/shopping-list" label={t('nav.shoppingList')} onClick={closeSidebar} />
            <NavItem icon={ChefHat} to="/app/recipes" label={t('nav.recipes')} onClick={closeSidebar} />
          </NavSection>

          <div className="mx-3 my-4 h-px bg-gradient-to-r from-transparent via-[#a10dfd]/45 to-transparent" />

          <NavSection title="Tools">
            <NavItem icon={Camera} to="/app/fridge-analyzer" label={t('nav.fridgeAnalyzer')} onClick={closeSidebar} />
          </NavSection>
        </nav>

        <div className="border-t border-white/10 bg-white/[0.02] p-4">
          <UserProfileDropdown />
        </div>
      </aside>
    </>
  );
}
