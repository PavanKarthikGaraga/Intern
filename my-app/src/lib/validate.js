/**
 * Shared request-input validators.
 *
 * Several routes build column names such as `day${day}` from request input,
 * so values that end up in SQL identifiers must be strictly validated here.
 */

/**
 * Parse an internship day number.
 * Accepts 1–7 as a number or numeric string; returns the integer, or null if invalid.
 * Note: a plain `day < 1 || day > 7` check is NOT enough — non-numeric strings
 * coerce to NaN and pass both comparisons.
 */
export function parseDay(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const str = String(value).trim();
  if (!/^[1-7]$/.test(str)) return null;
  return Number(str);
}
