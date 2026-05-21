import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/footer';
import { useI18n } from '@/hooks/use-i18n';
import { i18n, type Locale } from '@/lib/i18n';

type LegalPageKind = 'privacy' | 'imprint';

const routeConfig: Record<string, { locale: Locale; kind: LegalPageKind }> = {
  '/de/datenschutz': { locale: 'de', kind: 'privacy' },
  '/de/impressum': { locale: 'de', kind: 'imprint' },
  '/en/privacy': { locale: 'en', kind: 'privacy' },
  '/en/legal-notice': { locale: 'en', kind: 'imprint' },
};

const privacySections = [
  { title: 'privacy.1.title', paragraphs: ['privacy.1.content'] },
  { title: 'privacy.2.title', paragraphs: ['privacy.2.intro'], items: ['privacy.2.li1', 'privacy.2.li2', 'privacy.2.li3', 'privacy.2.li4'] },
  { title: 'privacy.3.title', paragraphs: ['privacy.3.intro'], items: ['privacy.3.li1', 'privacy.3.li2', 'privacy.3.li3', 'privacy.3.li4', 'privacy.3.li5', 'privacy.3.li6'] },
  { title: 'privacy.4.title', paragraphs: ['privacy.4.content'] },
  { title: 'privacy.5.title', paragraphs: ['privacy.5.intro'], items: ['privacy.5.li1', 'privacy.5.li2', 'privacy.5.li3'], outro: 'privacy.5.outro' },
  { title: 'privacy.6.title', paragraphs: ['privacy.6.content'] },
  { title: 'privacy.7.title', paragraphs: ['privacy.7.intro'], items: ['privacy.7.li1', 'privacy.7.li2', 'privacy.7.li3', 'privacy.7.li4', 'privacy.7.li5', 'privacy.7.li6', 'privacy.7.li7', 'privacy.7.li8'] },
  { title: 'privacy.8.title', paragraphs: ['privacy.8.content'] },
  { title: 'privacy.9.title', paragraphs: ['privacy.9.content'] },
  { title: 'privacy.10.title', paragraphs: ['privacy.10.content'] },
];

const imprintSections = [
  {
    title: 'imprint.responsible.title',
    paragraphs: ['imprint.responsible.content'],
    details: [
      ['imprint.developer', 'Jakob Leibel'],
      ['imprint.email', 'info@leibel.me'],
      ['imprint.website', 'https://smartpantry.app'],
      ['imprint.repository', 'https://github.com/Jacha93/smart-pantry'],
    ],
  },
  {
    title: 'imprint.disclaimer.title',
    subsections: [
      ['imprint.contentLiability.title', 'imprint.contentLiability.content'],
      ['imprint.linkLiability.title', 'imprint.linkLiability.content'],
      ['imprint.copyright.title', 'imprint.copyright.content'],
    ],
  },
  { title: 'imprint.technology.title', paragraphs: ['imprint.technology.content'] },
  { title: 'imprint.privacy.title', paragraphs: ['imprint.privacy.content'] },
];

function LegalSection({ section }: { section: typeof privacySections[number] }) {
  const { t } = useI18n();

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{t(section.title)}</h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-foreground/82">
          {t(paragraph)}
        </p>
      ))}
      {section.items ? (
        <ul className="list-disc space-y-1 pl-6 text-foreground/82">
          {section.items.map((item) => (
            <li key={item}>{t(item)}</li>
          ))}
        </ul>
      ) : null}
      {section.outro ? <p className="text-foreground/82">{t(section.outro)}</p> : null}
    </section>
  );
}

function ImprintSection({ section }: { section: typeof imprintSections[number] }) {
  const { t } = useI18n();

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-foreground">{t(section.title)}</h2>
      {'paragraphs' in section && section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="text-foreground/82">
          {t(paragraph)}
        </p>
      ))}
      {'details' in section && section.details ? (
        <dl className="grid gap-2 text-foreground/82 sm:grid-cols-[max-content_1fr]">
          {section.details.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-semibold text-foreground">{t(label)}:</dt>
              <dd>{value.startsWith('http') || value.includes('@') ? <a className="text-[#17f6fe] hover:underline" href={value.includes('@') ? `mailto:${value}` : value}>{value}</a> : value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {'subsections' in section && section.subsections?.map(([title, content]) => (
        <div key={title} className="space-y-2">
          <h3 className="font-semibold text-foreground">{t(title)}</h3>
          <p className="text-foreground/82">{t(content)}</p>
        </div>
      ))}
    </section>
  );
}

export default function LegalPage() {
  const location = useLocation();
  const config = routeConfig[location.pathname] || routeConfig['/en/privacy'];
  const { t } = useI18n();

  useEffect(() => {
    i18n.setLocale(config.locale);
    document.documentElement.lang = config.locale;
    document.title = `${config.kind === 'privacy' ? t('footer.privacyPolicy') : t('footer.imprint')} | Smart Pantry`;
  }, [config.locale, config.kind, t]);

  return (
    <div className="min-h-screen bg-background dotted-grid-24">
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="mb-8">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Smart Pantry
          </Link>
        </Button>
        <article className="space-y-8 rounded-lg border border-white/10 bg-[#0f0f13]/88 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] sm:p-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">
              {config.kind === 'privacy' ? t('footer.privacyPolicy') : t('footer.imprint')}
            </h1>
            <p className="text-muted-foreground">
              {config.kind === 'privacy' ? t('legal.lastUpdated') : t('legal.accordingTo')}
            </p>
          </header>
          {config.kind === 'privacy'
            ? privacySections.map((section) => <LegalSection key={section.title} section={section} />)
            : imprintSections.map((section) => <ImprintSection key={section.title} section={section} />)}
        </article>
      </main>
      <Footer />
    </div>
  );
}
