export const PHONE_COUNTRIES = {
  US: { name: 'United States', callingCode: '1', nationalDigits: 10 },
  CA: { name: 'Canada', callingCode: '1', nationalDigits: 10 },
  IN: { name: 'India', callingCode: '91', nationalDigits: 10 },
  AU: { name: 'Australia', callingCode: '61', nationalDigits: 9 },
  GB: { name: 'United Kingdom', callingCode: '44', nationalDigits: 10 },
} as const;

type PhoneCountry = keyof typeof PHONE_COUNTRIES;

export function normalizePhone(countryCode: string, raw: string) {
  const country = PHONE_COUNTRIES[countryCode.toUpperCase() as PhoneCountry];
  if (!country) throw new Error('INVALID_PHONE');
  const input = String(raw || '').trim().replace(/[()\s-]/g, '');
  const hasPlus = input.startsWith('+');
  const digits = input.replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) throw new Error('INVALID_PHONE');
  if (hasPlus && !digits.startsWith(country.callingCode)) throw new Error('INVALID_PHONE');
  const national = (hasPlus ? digits.slice(country.callingCode.length) : digits).replace(/^0+/, '');
  if (national.length !== country.nationalDigits || /^0+$/.test(national)) throw new Error('INVALID_PHONE');
  return `+${country.callingCode}${national}`;
}
