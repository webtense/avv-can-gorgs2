/**
 * Remitent per defecte dels correus enviats des del mòdul de comunicacions
 * (/admin/correu). Es poden sobreescriure amb les variables d'entorn
 * MAIL_FROM_EMAIL i MAIL_FROM_NAME; cap de les dues conté cap valor sensible.
 */
export const mailConfig = {
  fromEmail: process.env.MAIL_FROM_EMAIL || 'avvcangorgsii@gmail.com',
  fromName: process.env.MAIL_FROM_NAME || 'AVV Can Gorgs II',
};

export const siteConfig = {
  name: 'AVV Can Gorgs II',
  fullName: 'Associació de Veïns de Can Gorgs II',
  address: 'Carrer de la Torre d\'en Gorgs, 40 · 08210 Barberà del Vallès',
  email: 'avvcangorgsii@gmail.com' as string | null,
  phone: null as string | null,
  taxId: 'G59495218' as string | null,
};

export const navigation = [
  { href: '/', labelKey: 'common.nav.home' },
  { href: '/archive', labelKey: 'common.nav.archive' },
  { href: '/agenda', labelKey: 'common.nav.agenda' },
  { href: '/fotos', labelKey: 'common.nav.fotos' },
  { href: '/about', labelKey: 'common.nav.about' },
  { href: '/barri', labelKey: 'common.nav.barri' },
  { href: '/contact', labelKey: 'common.nav.contact' },
  { href: '/socis', labelKey: 'common.nav.socis' },
] as const;

export const footerLegal = [
  { href: '/terms', labelKey: 'terms.title' },
  { href: '/privacy', labelKey: 'privacy.title' },
  { href: '/cookies', labelKey: 'cookies.title' },
] as const;
