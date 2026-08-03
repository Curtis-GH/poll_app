/**
 * Number of full days until the deadline; negative or 0 if it has already passed.
 * @param deadline - the date to measure against now.
 * @returns the number of full days remaining.
 */
export function daysUntil(deadline: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((deadline.getTime() - Date.now()) / msPerDay);
}

/**
 * Label like "Ends in 3 Days" for survey cards, "Ended" once the deadline has passed.
 * @param deadline - the survey's deadline.
 * @returns the formatted label.
 */
export function formatDeadlineLabel(deadline: Date): string {
  const days = daysUntil(deadline);
  if (days <= 0) return 'Ended';
  if (days === 1) return 'Ends in 1 Day';
  return `Ends in ${days} Days`;
}

/**
 * Deadline formatted as DD.MM.YYYY, matching the detail view ("Ends on 01.09.2025").
 * @param deadline - the date to format.
 * @returns the formatted date string.
 */
export function formatDeadlineDate(deadline: Date): string {
  return deadline.toLocaleDateString('en-GB').replace(/\//g, '.');
}
