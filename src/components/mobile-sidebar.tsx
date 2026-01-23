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

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#18181b] border border-white/10 text-foreground hover:bg-[#17f6fe]/10 hover:text-[#17f6fe] transition-colors md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-[#18181b] border-r border-white/10 flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link to="/app" className="flex items-center space-x-3 hover:opacity-80 transition-opacity" onClick={closeSidebar}>
            <img
              src="/smart-pantry-favicon.png"
              alt="Smart Pantry Icon"
              width={32}
              height={32}
              className="rounded-lg shadow-[0_0_25px_rgba(23,246,254,0.35)]"
            />
            <h1 className="text-xl font-bold text-foreground">{t('nav.appTitle')}</h1>
          </Link>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-lg hover:bg-[#17f6fe]/10 hover:text-[#17f6fe] transition-colors text-foreground"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Navigation - Flex-Grow, Scrollbar */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {/* Dashboard - Alleine oberhalb */}
          <div className="mb-4">
            <NavItem icon={LayoutDashboard} to="/app" label="Dashboard" onClick={closeSidebar} />
          </div>

          {/* Trennstrich */}
          <div className="flex items-center px-6 my-4">
            <div className="flex-1 h-px bg-[#a10dfd]/30"></div>
            <div className="w-8 h-px bg-[#a10dfd]"></div>
            <div className="flex-1 h-px bg-[#a10dfd]/30"></div>
          </div>

          {/* General Section */}
          <NavSection title="General">
            <NavItem icon={Package} to="/app/groceries" label={t('nav.groceries')} onClick={closeSidebar} />
            <NavItem icon={ShoppingCart} to="/app/shopping-list" label={t('nav.shoppingList')} onClick={closeSidebar} />
            <NavItem icon={ChefHat} to="/app/recipes" label={t('nav.recipes')} onClick={closeSidebar} />
          </NavSection>

          {/* Trennstrich */}
          <div className="flex items-center px-6 my-4">
            <div className="flex-1 h-px bg-[#a10dfd]/30"></div>
            <div className="w-8 h-px bg-[#a10dfd]"></div>
            <div className="flex-1 h-px bg-[#a10dfd]/30"></div>
          </div>

          {/* Tools Section */}
          <NavSection title="Tools">
            <NavItem icon={Camera} to="/app/fridge-analyzer" label={t('nav.fridgeAnalyzer')} onClick={closeSidebar} />
          </NavSection>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-4">
          <UserProfileDropdown />
        </div>
      </aside>
    </>
  );
}
