export const siteConfig = {
  name: 'Associació de Veïns Can Gorgs II',
  foundedYear: null as number | null,
  address: null as string | null,
  phone: null as string | null,
  email: null as string | null,
  taxId: null as string | null,
  instagramUrl: null as string | null,
  facebookUrl: null as string | null,
};

export const navigation = [
  { href: '/', label: 'Inici' },
  { href: '/archive', label: 'Arxiu' },
  { href: '/about', label: 'L\'associació' },
  { href: '/contact', label: 'Contacte' },
];

export const footerLegal = [
  { href: '/terms', label: 'Avís legal' },
  { href: '/privacy', label: 'Política de privacitat' },
  { href: '/cookies', label: 'Política de cookies' },
];
