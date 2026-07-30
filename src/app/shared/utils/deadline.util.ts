export function daysUntil(deadline: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((deadline.getTime() - Date.now()) / msPerDay);
}

export function formatDeadlineLabel(deadline: Date): string {
  const days = daysUntil(deadline);
  if (days <= 0) return 'Ended';
  if (days === 1) return 'Ends in 1 Day';
  return `Ends in ${days} Days`;
}

export function formatDeadlineDate(deadline: Date): string {
  return deadline.toLocaleDateString('en-GB').replace(/\//g, '.');
}
