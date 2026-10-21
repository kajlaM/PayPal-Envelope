// We store integer cents. PayPal wants a string like "39.99".

export const CURRENCY = 'USD';

export function centsToValue(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) throw new Error(`Invalid cents: ${cents}`);
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export function valueToCents(value: string): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new Error(`Invalid amount: ${value}`);
  return Number(match[1]) * 100 + Number((match[2] ?? '0').padEnd(2, '0'));
}

export const money = (cents: number) => ({ currency_code: CURRENCY, value: centsToValue(cents) });
