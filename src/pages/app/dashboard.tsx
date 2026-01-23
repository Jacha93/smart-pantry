import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Camera, ChefHat, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { groceriesAPI, profileAPI } from '@/lib/api';
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
    },
    {
      icon: ShoppingCart,
      title: t('nav.shoppingList'),
      description: 'Verwalte deine Einkaufslisten',
      link: '/app/shopping-list',
      color: 'text-[#a10dfd]',
    },
    {
      icon: Camera,
      title: t('nav.fridgeAnalyzer'),
      description: 'Analysiere deinen Kühlschrank',
      link: '/app/fridge-analyzer',
      color: 'text-[#17f6fe]',
    },
    {
      icon: ChefHat,
      title: t('nav.recipes'),
      description: 'Entdecke neue Rezepte',
      link: '/app/recipes',
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Willkommen zurück! Hier ist eine Übersicht deiner Daten.</p>
      </div>

      {/* Statistiken */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('groceries.title')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGroceries}</div>
            <p className="text-xs text-muted-foreground">Gesamt im Inventar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Läuft bald ab</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">In den nächsten 3 Tagen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Niedriger Bestand</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Benötigt Nachschub</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rezepte</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipes}</div>
            <p className="text-xs text-muted-foreground">Gespeicherte Rezepte</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Schnellzugriff</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link}>
              <Card className="hover:border-[#17f6fe]/50 transition-all duration-300 hover:shadow-lg cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-[#17f6fe]/10 flex items-center justify-center mb-2`}>
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
