'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { FileText, Building2 } from 'lucide-react';

export function Footer() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isImprintOpen, setIsImprintOpen] = useState(false);
  const { t, locale } = useI18n();

  return (
    <>
      <footer className="border-t border-white/10 py-6 mt-auto w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-foreground font-medium">{t('nav.appTitle')}</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {t('footer.privacyPolicy')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsImprintOpen(true)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                {t('footer.imprint')}
              </Button>
              <p className="text-muted-foreground">
                {t('footer.rights')}
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Datenschutzerklärung Dialog */}
      <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('footer.privacyPolicy')}
            </DialogTitle>
            <DialogDescription>
              {t('legal.lastUpdated')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.1.title')}</h3>
              <p>{t('privacy.1.content')}</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.2.title')}</h3>
              <p className="mb-2">{t('privacy.2.intro')}</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('privacy.2.li1')}</li>
                <li>{t('privacy.2.li2')}</li>
                <li>{t('privacy.2.li3')}</li>
                <li>{t('privacy.2.li4')}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.3.title')}</h3>
              <p className="mb-2">{t('privacy.3.intro')}</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('privacy.3.li1')}</li>
                <li>{t('privacy.3.li2')}</li>
                <li>{t('privacy.3.li3')}</li>
                <li>{t('privacy.3.li4')}</li>
                <li>{t('privacy.3.li5')}</li>
                <li>{t('privacy.3.li6')}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.4.title')}</h3>
              <p>{t('privacy.4.content')}</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.5.title')}</h3>
              <p className="mb-2">{t('privacy.5.intro')}</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('privacy.5.li1')}</li>
                <li>{t('privacy.5.li2')}</li>
                <li>{t('privacy.5.li3')}</li>
              </ul>
              <p className="mt-2">{t('privacy.5.outro')}</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.6.title')}</h3>
              <p>{t('privacy.6.content')}</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.7.title')}</h3>
              <p className="mb-2">{t('privacy.7.intro')}</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>{t('privacy.7.li1')}</li>
                <li>{t('privacy.7.li2')}</li>
                <li>{t('privacy.7.li3')}</li>
                <li>{t('privacy.7.li4')}</li>
                <li>{t('privacy.7.li5')}</li>
                <li>{t('privacy.7.li6')}</li>
                <li>{t('privacy.7.li7')}</li>
                <li>{t('privacy.7.li8')}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.8.title')}</h3>
              <p>{t('privacy.8.content')}</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.9.title')}</h3>
              <p>{t('privacy.9.content')}</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('privacy.10.title')}</h3>
              <p>{t('privacy.10.content')}</p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Impressum Dialog */}
      <Dialog open={isImprintOpen} onOpenChange={setIsImprintOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('footer.imprint')}
            </DialogTitle>
            <DialogDescription>
              {t('legal.accordingTo')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('imprint.responsible.title')}</h3>
              <p>{t('imprint.responsible.content')}</p>
              <p className="mt-2">
                <strong>{t('imprint.developer')}:</strong> [Ihr Name]<br />
                <strong>{t('imprint.email')}:</strong> [Ihre E-Mail-Adresse]<br />
                <strong>{t('imprint.website')}:</strong> https://github.com/Jacha93/smart-pantry
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('imprint.disclaimer.title')}</h3>
              <h4 className="font-medium text-foreground mt-3 mb-2">{t('imprint.contentLiability.title')}</h4>
              <p>{t('imprint.contentLiability.content')}</p>
              
              <h4 className="font-medium text-foreground mt-3 mb-2">{t('imprint.linkLiability.title')}</h4>
              <p>{t('imprint.linkLiability.content')}</p>

              <h4 className="font-medium text-foreground mt-3 mb-2">{t('imprint.copyright.title')}</h4>
              <p>{t('imprint.copyright.content')}</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('imprint.technology.title')}</h3>
              <p>{t('imprint.technology.content')}</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">{t('imprint.privacy.title')}</h3>
              <p>{t('imprint.privacy.content')}</p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

