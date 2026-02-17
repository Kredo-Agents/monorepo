import { CREDIT_DIVISOR } from './const';

/** Convert stored tenths to display string, e.g. 500 -> "50.0" */
export function displayCredits(storedTenths: number): string {
  return (storedTenths / CREDIT_DIVISOR).toFixed(1);
}

/** Convert display credits to stored tenths, e.g. 50 -> 500 */
export function toStoredCredits(displayAmount: number): number {
  return Math.round(displayAmount * CREDIT_DIVISOR);
}
