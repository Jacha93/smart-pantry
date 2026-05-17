import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Camera, ChefHat, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { groceriesAPI } from '@/lib/api';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState({
    totalGroceries: 0,
    expiringSoon: 0,
    lowStock: 0,
    totalRecipes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Lade Groceries
      const groceriesResponse = await groceriesAPI.getAll();
      const groceries = Array.isArray(groceriesResponse.data) ? groceriesResponse.data : [];
      
      // Berechne Statistiken
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const expiringSoon = groceries.filter((g: any) => {
        if (!g.expiry_date) return false;
        const expiry = new Date(g.expiry_date);
        return expiry <= threeDaysFromNow && expiry >= today;
      }).length;
      
      const lowStock = groceries.filter((g: any) => {
        return g.quantity && g.quantity < 3;
      }).length;

      setStats({
        totalGroceries: groceries.length,
        expiringSoon,
        lowStock,
        totalRecipes: 0, // Wird später geladen
      });
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast.error('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      icon: Package,
      title: t('nav.groceries'),
      description: t('groceries.subtitle'),
      link: '/app/groceries',
      color: 'text-[#17f6fe]',
      tint: 'bg-[#17f6fe]/10 border-[#17f6fe]/20',
    },
    {
      icon: ShoppingCart,
      title: t('nav.shoppingList'),
      description: 'Verwalte deine Einkaufslisten',
      link: '/app/shopping-list',
      color: 'text-[#a10dfd]',
      tint: 'bg-[#a10dfd]/10 border-[#a10dfd]/20',
    },
    {
      icon: Camera,
      title: t('nav.fridgeAnalyzer'),
      description: 'Analysiere deinen Kühlschrank',
      link: '/app/fridge-analyzer',
      color: 'text-[#17f6fe]',
      tint: 'bg-[#17f6fe]/10 border-[#17f6fe]/20',
    },
    {
      icon: ChefHat,
      title: t('nav.recipes'),
      description: 'Entdecke neue Rezepte',
      link: '/app/recipes',
      color: 'text-[#a10dfd]',
      tint: 'bg-[#a10dfd]/10 border-[#a10dfd]/20',
    },
  ];

  const statCards = [
    {
      label: t('groceries.title'),
      value: stats.totalGroceries,
      detail: 'Gesamt im Inventar',
      icon: Package,
      color: 'text-[#17f6fe]',
    },
    {
      label: 'Läuft bald ab',
      value: stats.expiringSoon,
      detail: 'In den nächsten 3 Tagen',
      icon: AlertTriangle,
      color: 'text-amber-300',
    },
    {
      label: 'Niedriger Bestand',
      value: stats.lowStock,
      detail: 'Benötigt Nachschub',
      icon: TrendingUp,
      color: 'text-amber-300',
    },
    {
      label: 'Rezepte',
      value: stats.totalRecipes,
      detail: 'Gespeicherte Rezepte',
      icon: ChefHat,
      color: 'text-[#a10dfd]',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-[#101014] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-[#17f6fe]">Kitchen overview</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Willkommen zurück. Deine wichtigsten Küchen-Signale sind hier kompakt zusammengefasst.
            </p>
          </div>
          <Link to="/app/groceries">
            <Button variant="outline">
              Bestand prüfen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-semibold ${stat.color}`}>{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Schnellzugriff</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link}>
              <Card className="group cursor-pointer">
                <CardHeader>
                  <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-md border ${action.tint}`}>
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                  <div className="pt-3 text-sm font-semibold text-[#17f6fe] opacity-0 transition-opacity group-hover:opacity-100">
                    Öffnen
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
