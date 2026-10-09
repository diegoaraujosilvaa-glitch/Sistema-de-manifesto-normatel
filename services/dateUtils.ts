/**
 * Date utility functions to handle Brazilian date formatting without timezone shifts.
 * Standard JavaScript `new Date("YYYY-MM-DD")` interprets date-only strings as UTC midnight,
 * which in Brazilian timezones (e.g. UTC-3) causes a 3-hour backward shift to the previous day
 * (e.g. "2026-10-08" displays as "07/10/2026").
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in local time (never shifted to UTC).
 */
export const getLocalDateString = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats any date string (YYYY-MM-DD or ISO timestamp) to Brazilian format DD/MM/YYYY.
 * Prevents timezone shifting for pure date strings like deliveryDate and conferenceDate.
 */
export const formatDateBR = (dateInput?: string | Date | null | any): string => {
  if (!dateInput) return '-';

  // 1. If it's a Firestore Timestamp or object with toDate
  let val = dateInput;
  if (typeof val === 'object' && val !== null && typeof val.toDate === 'function') {
    val = val.toDate();
  }

  // 2. If it's a Date instance
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '-';
    const day = String(val.getDate()).padStart(2, '0');
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const year = val.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const str = String(val).trim();
  if (!str) return '-';

  // 3. If it's already in Brazilian DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  // 4. If it contains a date pattern YYYY-MM-DD (e.g. standard HTML date input, ISO, etc.)
  const ymdMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${day}/${month}/${year}`;
  }

  // 5. Fallback for other parseable date formats
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('pt-BR');
  }

  return str;
};
