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
export const formatDateBR = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const str = String(dateStr).trim();

  // If in YYYY-MM-DD format (standard HTML date input value)
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${day}/${month}/${year}`;
  }

  // If in YYYY-MM-DDT00:00:00... format (UTC midnight representation of a date)
  const midnightMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})T00:00:00/);
  if (midnightMatch) {
    const [, year, month, day] = midnightMatch;
    return `${day}/${month}/${year}`;
  }

  // If ISO string with timestamp (e.g. createdAt: 2026-10-08T14:35:10.000Z)
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('pt-BR');
  }

  return str;
};
