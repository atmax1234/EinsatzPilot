import { randomBytes } from 'node:crypto';

export function generateCustomerReportNumber(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = randomBytes(5).toString('hex').toUpperCase();
  return `CR-${date}-${suffix}`;
}
