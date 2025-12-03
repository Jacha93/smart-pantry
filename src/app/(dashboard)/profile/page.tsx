'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/components/profile-form';
import { PasswordChangeForm } from '@/components/password-change-form';
import { UsageOverview } from '@/components/usage-overview';
import { UsageChart } from '@/components/usage-chart';
import { PlanComparison } from '@/components/plan-comparison';
import { profileAPI, adminAPI, api } from '@/lib/api';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { User, Lock, BarChart3, Crown, Infinity, AlertTriangle, Download, Trash2, Users } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatDate } from '@/lib/date-utils';
import { AdminSwitch } from '@/components/admin-switch';

interface UserProfile {
  id: number;
  email: string;
  name: string; // Legacy
  fullName?: string;
  username?: string;
  role: string;
  createdAt: string;
  quotas: {
    llm_tokens_total: number;
    llm_tokens_used: number;
    recipe_calls_total: number;
    recipe_calls_used: number;
    reset_at: string;
    maxCacheRecipeSuggestions: number;
    maxChatMessages: number;
    maxCacheRecipeSearchViaChat: number;
    maxGroceriesWithExpiry: number;
    maxGroceriesTotal: number;
    cacheRecipeSuggestionsUsed: number;
    chatMessagesUsed: number;
    cacheRecipeSearchViaChatUsed: number;
    monthlyLimitResetAt: string;
    notificationsEnabled: boolean;
    hasPrioritySupport: boolean;
    currentGroceriesTotal: number;
    currentGroceriesWithExpiry: number;
  };
}

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Lade Profil zuerst, dann Usage (sequenziell für besseres Error-Handling)
    fetchProfile().then(() => {
      // Usage kann parallel geladen werden, nachdem Profil geladen wurde
      fetchUsage();
    });
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await profileAPI.get();
      console.log('Profile API Response:', response.data);
      // Prüfe ob response.data ein gültiges Objekt ist (nicht leer)
      if (response.data && typeof response.data === 'object' && Object.keys(response.data).length > 0) {
        setProfile(response.data);
      } else if (response.data && typeof response.data === 'object' && Object.keys(response.data).length === 0) {
        // Leeres Objekt {} bedeutet wahrscheinlich 304 Not Modified
        // Prüfe ob es ein X-Original-Status Header gibt (vom Proxy gesetzt)
        const is304 = response.headers && response.headers['x-original-status'] === '304';
        if (is304) {
          // 304 Not Modified - Backend hat keine Daten gesendet
          // Versuche es nochmal OHNE Cache-Header (If-None-Match)
          console.warn('Profile API returned 304 Not Modified, retrying without cache...');
          // Lösche Cache-Header und versuche es nochmal
          setTimeout(async () => {
            try {
              // Erstelle einen neuen Request OHNE Cache-Header
              const retryResponse = await api.get('/me', {
                headers: {
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache',
                },
              });
              if (retryResponse.data && typeof retryResponse.data === 'object' && Object.keys(retryResponse.data).length > 0) {
                setProfile(retryResponse.data);
              } else {
                console.error('Retry still returned empty data:', retryResponse);
                toast.error(t('profile.failedToLoad'));
              }
            } catch (retryError) {
              console.error('Retry failed:', retryError);
              toast.error(t('profile.failedToLoad'));
            }
          }, 500);
        } else {
          // Kein 304 - wahrscheinlich Backend-Fehler
          console.error('Profile API returned empty object:', response);
          toast.error(t('profile.failedToLoad'));
        }
      } else {
        console.error('Profile API returned empty data:', response);
        toast.error(t('profile.failedToLoad'));
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Wenn 401 oder 403, könnte es ein Token-Problem sein - versuche es nochmal nach kurzer Verzögerung
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Token might be expired, retrying after refresh...');
        setTimeout(() => {
          fetchProfile();
        }, 1000);
        return;
      }
      
      toast.error(error.response?.data?.detail || t('profile.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await profileAPI.getUsage();
      console.log('Usage API Response:', response.data);
      if (response.data) {
        setUsage(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching usage:', error);
      console.error('Usage error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      // Usage-Fehler sind nicht kritisch, wir zeigen einfach keine Usage-Daten
    }
  };

  const handleProfileUpdate = async (data: { name?: string; email?: string }) => {
    try {
      await profileAPI.update(data);
      toast.success(t('profile.updatedSuccess'));
      fetchProfile();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || t('profile.updateFailed');
      toast.error(errorMessage);
    }
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    try {
      await profileAPI.changePassword(currentPassword, newPassword);
      toast.success(t('profile.passwordChangedSuccess'));
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || t('profile.passwordChangeFailed');
      toast.error(errorMessage);
    }
  };

  const handleExportData = async () => {
    try {
      toast.loading(t('profile.exporting'));
      const response = await profileAPI.exportData();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smart-pantry-data-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success(t('profile.exportSuccess'));
    } catch (error: any) {
      toast.dismiss();
      toast.error(t('profile.exportFailed'));
      console.error('Export error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      toast.loading(t('profile.deleting'));
      await profileAPI.deleteAccount();
      toast.dismiss();
      toast.success(t('profile.accountDeleted'));
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.detail || t('profile.deleteFailed'));
      console.error('Delete account error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('profile.notFound')}</p>
      </div>
    );
  }

  // Determine current plan based on quotas
  const getCurrentPlan = () => {
    const { quotas } = profile;
    if (quotas.hasPrioritySupport) return 'pro';
    if (quotas.maxCacheRecipeSuggestions === 30 && quotas.maxChatMessages === 16) return 'basic';
    return 'free';
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('profile.tabs.profile')}
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('profile.tabs.usage')}
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            {t('profile.tabs.plan')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {t('profile.tabs.security')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.personalInfo')}</CardTitle>
                <CardDescription>{t('profile.personalInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                    <ProfileForm
                      initialData={{ 
                        fullName: profile.fullName || profile.name, 
                        username: profile.username || '',
                        email: profile.email 
                      }}
                      onSubmit={handleProfileUpdate}
                    />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('profile.accountInfo')}</CardTitle>
                <CardDescription>{t('profile.accountInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-muted-foreground">{t('profile.memberSince')}</span>
                  <span className="font-medium">
                    {formatDate(profile.createdAt, locale)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-muted-foreground">{t('profile.currentPlan')}</span>
                  <span className="font-medium capitalize px-3 py-1 rounded-full bg-primary/20 text-primary">
                    {currentPlan}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">{t('profile.email')}</span>
                  <span className="font-medium">{profile.email}</span>
                </div>
                {profile.fullName && (
                  <div className="flex justify-between items-center py-2 border-t border-white/10">
                    <span className="text-muted-foreground">{t('profile.fullName')}</span>
                    <span className="font-medium">{profile.fullName}</span>
                  </div>
                )}
                {profile.username && (
                  <div className="flex justify-between items-center py-2 border-t border-white/10">
                    <span className="text-muted-foreground">{t('profile.username')}</span>
                    <span className="font-medium">{profile.username}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Admin Switch (only for admins) */}
          {profile.role === 'ADMIN' && (
            <Card className="border-yellow-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-500">
                  <Users className="h-5 w-5" />
                  Admin Panel
                </CardTitle>
                <CardDescription>Switch between user accounts for testing</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminSwitch />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Usage Tab - Dashboard Style */}
        <TabsContent value="usage" className="space-y-6 mt-6">
          {/* Usage Stats Cards */}
          {usage && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('profile.usage.llmTokens')}</p>
                      <p className="text-2xl font-bold">
                        {usage.llmTokens.used.toLocaleString()} / {usage.llmTokens.total.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-3xl text-blue-500">💬</div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${usage.llmTokens.percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{usage.llmTokens.percent}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('profile.usage.recipeCalls')}</p>
                      <p className="text-2xl font-bold">
                        {usage.recipeCalls.used.toLocaleString()} / {usage.recipeCalls.total.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-3xl text-green-500">🍳</div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${usage.recipeCalls.percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{usage.recipeCalls.percent}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('profile.usage.chatMessages')}</p>
                      <p className="text-2xl font-bold">
                        {usage.chatMessages.used.toLocaleString()} / {usage.chatMessages.total.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-3xl text-purple-500">💭</div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${usage.chatMessages.percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{usage.chatMessages.percent}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('profile.usage.groceriesTotal')}</p>
                      <p className="text-2xl font-bold">
                        {usage.groceriesTotal.used.toLocaleString()} / {usage.groceriesTotal.unlimited ? '∞' : usage.groceriesTotal.total.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-3xl text-cyan-500">🛒</div>
                  </div>
                  <div className="mt-4">
                    {!usage.groceriesTotal.unlimited && (
                      <>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500 transition-all duration-500"
                            style={{ width: `${usage.groceriesTotal.percent}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{usage.groceriesTotal.percent}%</p>
                      </>
                    )}
                    {usage.groceriesTotal.unlimited && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Infinity className="h-3 w-3" />
                        {t('profile.unlimited')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Line Charts */}
          {usage && (
            <div>
              <UsageChart usage={usage} />
            </div>
          )}

          {/* Detailed Overview */}
          {usage && (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.usageOverview')}</CardTitle>
                <CardDescription>{t('profile.usageOverviewDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <UsageOverview usage={usage} quotas={profile.quotas} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.planManagement')}</CardTitle>
              <CardDescription>{t('profile.planManagementDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanComparison currentPlan={currentPlan} quotas={profile.quotas} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.changePassword')}</CardTitle>
              <CardDescription>{t('profile.changePasswordDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm onSubmit={handlePasswordChange} />
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                {t('profile.exportData')}
              </CardTitle>
              <CardDescription>{t('profile.exportDataDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleExportData} 
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {t('profile.exportData')}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-5 w-5" />
                {t('profile.dangerZone')}
              </CardTitle>
              <CardDescription className="text-red-500/80">
                {t('profile.deleteAccountDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('profile.deleteAccount')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-500">{t('profile.deleteAccount')}</DialogTitle>
                    <DialogDescription>
                      {t('profile.confirmDelete')}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {}}>
                      {t('common.cancel')}
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      {t('profile.deleteAccount')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

