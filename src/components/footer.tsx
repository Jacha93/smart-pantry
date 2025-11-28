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
      <footer className="border-t border-white/10 py-8 mt-auto">
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
                {locale === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsImprintOpen(true)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                {locale === 'de' ? 'Impressum' : 'Imprint'}
              </Button>
              <p className="text-muted-foreground">
                {locale === 'de' ? '© 2025 Smart Pantry. Alle Rechte vorbehalten.' : '© 2025 Smart Pantry. All rights reserved.'}
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
              {locale === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'de' 
                ? 'Stand: Januar 2025'
                : 'Last updated: January 2025'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
            {locale === 'de' ? (
              <>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">1. Verantwortlicher</h3>
                  <p>
                    Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist der Betreiber dieser Anwendung.
                    Kontaktdaten finden Sie im Impressum.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">2. Erhebung und Speicherung personenbezogener Daten</h3>
                  <p className="mb-2">Bei der Nutzung von Smart Pantry erheben und speichern wir folgende Daten:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Registrierung:</strong> E-Mail-Adresse, Name, verschlüsseltes Passwort (bcrypt Hash)</li>
                    <li><strong>Nutzung:</strong> Lebensmittel-Inventar, Rezepte, Einkaufslisten, Fotos (zur Analyse)</li>
                    <li><strong>Technische Daten:</strong> IP-Adresse, Browser-Informationen, Geräteinformationen</li>
                    <li><strong>Nutzungsdaten:</strong> API-Quota-Verbrauch (LLM-Tokens, Rezept-API-Calls) für Quota-Management</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">3. Zweck der Datenverarbeitung</h3>
                  <p className="mb-2">Ihre Daten werden für folgende Zwecke verarbeitet:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Bereitstellung und Verbesserung der Smart Pantry App</li>
                    <li>Authentifizierung und Autorisierung</li>
                    <li>KI-gestützte Foto-Analyse von Lebensmitteln</li>
                    <li>Rezeptvorschläge basierend auf Ihrem Inventar</li>
                    <li>Quota-Management für API-Nutzung (LLM, Rezept-APIs)</li>
                    <li>Einhaltung gesetzlicher Bestimmungen</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">4. Verschlüsselung sensibler Daten</h3>
                  <p>
                    Sensible personenbezogene Daten (Passwörter, Adressen, Bankdaten) werden nach DSGVO-Standards 
                    verschlüsselt gespeichert. Wir verwenden AES-256-GCM Verschlüsselung für verschlüsselte Profildaten.
                    Passwörter werden als bcrypt-Hashes gespeichert und können nicht entschlüsselt werden.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">5. Datenweitergabe an Dritte</h3>
                  <p className="mb-2">Wir nutzen folgende externe Dienste:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Google Gemini API:</strong> Für KI-gestützte Foto-Analyse und Chat-Funktionen</li>
                    <li><strong>Spoonacular API:</strong> Für Rezeptvorschläge und Rezeptdaten</li>
                    <li><strong>GitHub:</strong> Für Issue-Tracking (bei gemeldeten Problemen)</li>
                  </ul>
                  <p className="mt-2">
                    Diese Dienste verarbeiten Daten gemäß ihren eigenen Datenschutzerklärungen. 
                    Wir geben keine Daten an Dritte weiter, außer es ist gesetzlich erforderlich.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">6. Speicherdauer</h3>
                  <p>
                    Ihre Daten werden so lange gespeichert, wie es für die Erfüllung der Zwecke erforderlich ist 
                    oder gesetzliche Aufbewahrungspflichten bestehen. Bei Löschung Ihres Kontos werden alle 
                    personenbezogenen Daten gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">7. Ihre Rechte</h3>
                  <p className="mb-2">Sie haben folgende Rechte gemäß DSGVO:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
                    <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
                    <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
                    <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                    <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                    <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
                    <li>Widerruf Ihrer Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
                    <li>Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">8. Cookies und Tracking</h3>
                  <p>
                    Wir verwenden technisch notwendige Cookies für die Funktionalität der App. 
                    Für Free-Tier-Nutzer können Werbe-Cookies (z.B. Google AdSense) verwendet werden. 
                    Sie können Cookies in Ihren Browser-Einstellungen deaktivieren.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">9. Sicherheit</h3>
                  <p>
                    Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten vor 
                    unbefugtem Zugriff, Verlust oder Zerstörung zu schützen. Dies umfasst 
                    Verschlüsselung, sichere Authentifizierung (JWT, Refresh Tokens) und regelmäßige 
                    Sicherheitsupdates.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">10. Kontakt</h3>
                  <p>
                    Bei Fragen zum Datenschutz kontaktieren Sie uns bitte über die im Impressum 
                    angegebenen Kontaktdaten.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">1. Data Controller</h3>
                  <p>
                    The data controller responsible for data processing in accordance with GDPR is the operator of this application.
                    Contact details can be found in the imprint.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">2. Collection and Storage of Personal Data</h3>
                  <p className="mb-2">When using Smart Pantry, we collect and store the following data:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Registration:</strong> Email address, name, encrypted password (bcrypt hash)</li>
                    <li><strong>Usage:</strong> Grocery inventory, recipes, shopping lists, photos (for analysis)</li>
                    <li><strong>Technical Data:</strong> IP address, browser information, device information</li>
                    <li><strong>Usage Data:</strong> API quota consumption (LLM tokens, recipe API calls) for quota management</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">3. Purpose of Data Processing</h3>
                  <p className="mb-2">Your data is processed for the following purposes:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Provision and improvement of the Smart Pantry app</li>
                    <li>Authentication and authorization</li>
                    <li>AI-powered photo analysis of groceries</li>
                    <li>Recipe suggestions based on your inventory</li>
                    <li>Quota management for API usage (LLM, recipe APIs)</li>
                    <li>Compliance with legal requirements</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">4. Encryption of Sensitive Data</h3>
                  <p>
                    Sensitive personal data (passwords, addresses, bank details) are stored encrypted 
                    according to GDPR standards. We use AES-256-GCM encryption for encrypted profile data.
                    Passwords are stored as bcrypt hashes and cannot be decrypted.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">5. Data Sharing with Third Parties</h3>
                  <p className="mb-2">We use the following external services:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Google Gemini API:</strong> For AI-powered photo analysis and chat functions</li>
                    <li><strong>Spoonacular API:</strong> For recipe suggestions and recipe data</li>
                    <li><strong>GitHub:</strong> For issue tracking (for reported problems)</li>
                  </ul>
                  <p className="mt-2">
                    These services process data according to their own privacy policies. 
                    We do not share data with third parties unless legally required.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">6. Storage Duration</h3>
                  <p>
                    Your data will be stored for as long as necessary to fulfill the purposes 
                    or legal retention obligations exist. When you delete your account, all 
                    personal data will be deleted, unless legal retention obligations apply.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">7. Your Rights</h3>
                  <p className="mb-2">You have the following rights under GDPR:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Access to your stored data (Art. 15 GDPR)</li>
                    <li>Correction of incorrect data (Art. 16 GDPR)</li>
                    <li>Deletion of your data (Art. 17 GDPR)</li>
                    <li>Restriction of processing (Art. 18 GDPR)</li>
                    <li>Data portability (Art. 20 GDPR)</li>
                    <li>Objection to processing (Art. 21 GDPR)</li>
                    <li>Revocation of your consent (Art. 7 para. 3 GDPR)</li>
                    <li>Complaint to a supervisory authority (Art. 77 GDPR)</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">8. Cookies and Tracking</h3>
                  <p>
                    We use technically necessary cookies for the functionality of the app. 
                    For Free Tier users, advertising cookies (e.g., Google AdSense) may be used. 
                    You can disable cookies in your browser settings.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">9. Security</h3>
                  <p>
                    We implement technical and organizational measures to protect your data from 
                    unauthorized access, loss, or destruction. This includes encryption, secure 
                    authentication (JWT, Refresh Tokens), and regular security updates.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">10. Contact</h3>
                  <p>
                    For questions about data protection, please contact us using the contact 
                    details provided in the imprint.
                  </p>
                </section>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Impressum Dialog */}
      <Dialog open={isImprintOpen} onOpenChange={setIsImprintOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {locale === 'de' ? 'Impressum' : 'Imprint'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'de' 
                ? 'Angaben gemäß § 5 TMG'
                : 'Information according to § 5 TMG'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
            {locale === 'de' ? (
              <>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">Verantwortlich für den Inhalt</h3>
                  <p>
                    Smart Pantry ist eine Anwendung zur intelligenten Verwaltung von Lebensmittel-Inventaren 
                    mit KI-gestützten Rezeptvorschlägen.
                  </p>
                  <p className="mt-2">
                    <strong>Entwickler:</strong> [Ihr Name]<br />
                    <strong>E-Mail:</strong> [Ihre E-Mail-Adresse]<br />
                    <strong>Website:</strong> https://github.com/Jacha93/smart-pantry
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">Haftungsausschluss</h3>
                  <h4 className="font-medium text-foreground mt-3 mb-2">Haftung für Inhalte</h4>
                  <p>
                    Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                    Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. 
                    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten 
                    nach den allgemeinen Gesetzen verantwortlich.
                  </p>
                  
                  <h4 className="font-medium text-foreground mt-3 mb-2">Haftung für Links</h4>
                  <p>
                    Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen 
                    Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. 
                    Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber 
                    der Seiten verantwortlich.
                  </p>

                  <h4 className="font-medium text-foreground mt-3 mb-2">Urheberrecht</h4>
                  <p>
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
                    dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art 
                    der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen 
                    Zustimmung des jeweiligen Autors bzw. Erstellers.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">Technologie</h3>
                  <p>
                    Smart Pantry nutzt moderne Web-Technologien wie Next.js 16, React 19.2, TypeScript, 
                    PostgreSQL, Prisma ORM und KI-APIs (Google Gemini, Spoonacular) für die Funktionalität 
                    der Anwendung.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">Datenschutz</h3>
                  <p>
                    Informationen zum Datenschutz finden Sie in unserer Datenschutzerklärung, 
                    die Sie über den Link im Footer aufrufen können.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">Responsible for Content</h3>
                  <p>
                    Smart Pantry is an application for intelligent grocery inventory management 
                    with AI-powered recipe suggestions.
                  </p>
                  <p className="mt-2">
                    <strong>Developer:</strong> [Your Name]<br />
                    <strong>Email:</strong> [Your Email Address]<br />
                    <strong>Website:</strong> https://github.com/Jacha93/smart-pantry
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">Disclaimer</h3>
                  <h4 className="font-medium text-foreground mt-3 mb-2">Liability for Content</h4>
                  <p>
                    The contents of our pages have been created with the greatest care. However, we cannot 
                    guarantee the accuracy, completeness, and timeliness of the content. As a service provider, 
                    we are responsible for our own content on these pages in accordance with § 7 para. 1 TMG 
                    under general law.
                  </p>
                  
                  <h4 className="font-medium text-foreground mt-3 mb-2">Liability for Links</h4>
                  <p>
                    Our offer contains links to external websites of third parties, on whose contents we have 
                    no influence. Therefore, we cannot assume any liability for these external contents. 
                    The respective provider or operator of the pages is always responsible for the contents 
                    of the linked pages.
                  </p>

                  <h4 className="font-medium text-foreground mt-3 mb-2">Copyright</h4>
                  <p>
                    The content and works created by the site operators on these pages are subject to German 
                    copyright law. The duplication, processing, distribution, and any kind of exploitation 
                    outside the limits of copyright require the written consent of the respective author or creator.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">Technology</h3>
                  <p>
                    Smart Pantry uses modern web technologies such as Next.js 16, React 19.2, TypeScript, 
                    PostgreSQL, Prisma ORM, and AI APIs (Google Gemini, Spoonacular) for the functionality 
                    of the application.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-foreground mb-2">Privacy</h3>
                  <p>
                    Information about data protection can be found in our privacy policy, 
                    which you can access via the link in the footer.
                  </p>
                </section>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

