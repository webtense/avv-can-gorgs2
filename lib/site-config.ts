export const siteConfig = {
  name: 'AVV Can Gorgs II',
  fullName: 'Associació de Veïns de Can Gorgs II',
  address: 'Carrer de la Torre d\'en Gorgs, 40 · 08210 Barberà del Vallès',
  email: 'avvcangorgsii@gmail.com' as string | null,
  phone: null as string | null,
  taxId: 'G59495218' as string | null,
};

export const navigation = [
  { href: '/', label: 'Inici' },
  { href: '/archive', label: 'Arxiu' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/fotos', label: 'Fotos' },
  { href: '/about', label: 'L\'associació' },
  { href: '/barri', label: 'El barri' },
  { href: '/contact', label: 'Contacte' },
  { href: '/socis', label: 'Socis' },
];

export const footerLegal = [
  { href: '/terms', label: 'Avís legal' },
  { href: '/privacy', label: 'Política de privacitat' },
  { href: '/cookies', label: 'Política de cookies' },
];
