/** Anzahl voller Tage bis zur Deadline; negativ bzw. 0, wenn sie bereits verstrichen ist. */
export function daysUntil(deadline: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((deadline.getTime() - Date.now()) / msPerDay);
}

/** Label wie "Ends in 3 Days" fuer Survey-Karten, "Ended" wenn die Deadline vorbei ist. */
export function formatDeadlineLabel(deadline: Date): string {
  const days = daysUntil(deadline);
  if (days <= 0) return 'Ended';
  if (days === 1) return 'Ends in 1 Day';
  return `Ends in ${days} Days`;
}

/** Deadline im Format TT.MM.JJJJ, passend zur Detailansicht ("Ends on 01.09.2025"). */
export function formatDeadlineDate(deadline: Date): string {
  return deadline.toLocaleDateString('en-GB').replace(/\//g, '.');
}
