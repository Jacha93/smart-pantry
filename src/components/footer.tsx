import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { FileText, Building2 } from 'lucide-react';

export function Footer() {
  const { t, locale } = useI18n();
  const privacyPath = locale === 'de' ? '/de/datenschutz' : '/en/privacy';
  const imprintPath = locale === 'de' ? '/de/impressum' : '/en/legal-notice';

  return (
    <footer className="mt-auto w-full border-t border-white/10 bg-[#0f0f13] py-6 shadow-[0_-18px_40px_rgba(0,0,0,0.22)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-foreground font-medium">{t('nav.appTitle')}</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <Link to={privacyPath}>
                <FileText className="h-4 w-4" />
                {t('footer.privacyPolicy')}
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <Link to={imprintPath}>
                <Building2 className="h-4 w-4" />
                {t('footer.imprint')}
              </Link>
            </Button>
            <p className="text-muted-foreground">
              {t('footer.rights')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
