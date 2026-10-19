/** Convert a Europe/Kyiv civil date and time into an exact UTC instant (DST aware). */
export function kyivBookingIso(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('Укажіть дату і час бронювання');
  }
  const assumedUtc = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(assumedUtc)) throw new Error('Некоректна дата');
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Kyiv', hourCycle: 'h23', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(assumedUtc)).map(p => [p.type,p.value]));
  const localUtc = Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second));
  return new Date(assumedUtc - (localUtc - assumedUtc)).toISOString();
}
