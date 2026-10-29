const PHONE = /^\+?\d{10,15}$/;

/** "+880 1712-345678" becomes "+8801712345678". Empty stays empty. */
export function normalisePhone(phone: string): string {
  return phone.trim().replace(/[\s().-]/g, '');
}

/** Why a phone number cannot be used, or null. An empty number is allowed: the phone is optional. */
export function phoneProblem(phone: string): string | null {
  const value = normalisePhone(phone);
  return value === '' || PHONE.test(value) ? null : 'Enter a phone number of 10 to 15 digits.';
}
