'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileForm } from '@/components/profile-form';
import { PasswordChangeForm } from '@/components/password-change-form';
import { UsageOverview } from '@/components/usage-overview';
import { UsageChart } from '@/components/usage-chart';
import { PlanComparison } from '@/components/plan-comparison';
import { profileAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import { User, Lock, BarChart3, Crown } from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  name: string;
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
  const { t } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchProfile();
    fetchUsage();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.get();
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(t('profile.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await profileAPI.getUsage();
      setUsage(response.data);
    } catch (error) {
      console.error('Error fetching usage:', error);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
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

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.personalInfo')}</CardTitle>
              <CardDescription>{t('profile.personalInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                initialData={{ name: profile.name, email: profile.email }}
                onSubmit={handleProfileUpdate}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.accountInfo')}</CardTitle>
              <CardDescription>{t('profile.accountInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('profile.memberSince')}</span>
                <span className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('profile.currentPlan')}</span>
                <span className="font-medium capitalize">{currentPlan}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.usageOverview')}</CardTitle>
              <CardDescription>{t('profile.usageOverviewDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {usage ? (
                <UsageOverview usage={usage} quotas={profile.quotas} />
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">{t('common.loading')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.usageChart')}</CardTitle>
              <CardDescription>{t('profile.usageChartDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {usage ? (
                <UsageChart usage={usage} />
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">{t('common.loading')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
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

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.changePassword')}</CardTitle>
              <CardDescription>{t('profile.changePasswordDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordChangeForm onSubmit={handlePasswordChange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

