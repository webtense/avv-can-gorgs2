const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}

export function isValidName(name: string): boolean {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 150;
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return true;
  return /^[0-9+\s()-]{6,20}$/.test(phone);
}

export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 4;
}
