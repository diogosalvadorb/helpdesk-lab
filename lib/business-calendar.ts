export type WorkCalendar = {
  timeZone: string;
  alwaysOpen: boolean;
  hours: { weekday: number; startMinute: number; endMinute: number }[];
  holidays: { date: Date }[];
};

export class CalendarConfigurationError extends Error {
  constructor() {
    super(
      "O calendário de atendimento está inválido. Entre em contato com o suporte.",
    );
  }
}

/** Count elapsed working time on the UTC timeline, including DST transitions.
 * The horizon bounds invalid/sparse calendars instead of looping indefinitely.
 */
export function addWorkingMinutes(
  start: Date,
  minutes: number,
  calendar: WorkCalendar,
): Date {
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isSafeInteger(minutes) ||
    minutes <= 0 ||
    minutes > 525600
  )
    throw new CalendarConfigurationError();
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: calendar.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    throw new CalendarConfigurationError();
  }
  if (calendar.alwaysOpen) return new Date(start.getTime() + minutes * 60000);
  if (
    !calendar.hours.length ||
    calendar.hours.some(
      (h) =>
        !Number.isInteger(h.weekday) ||
        h.weekday < 0 ||
        h.weekday > 6 ||
        !Number.isInteger(h.startMinute) ||
        !Number.isInteger(h.endMinute) ||
        h.startMinute < 0 ||
        h.endMinute > 1440 ||
        h.startMinute >= h.endMinute,
    )
  )
    throw new CalendarConfigurationError();
  const holidays = new Set(
    calendar.holidays.map((h) => h.date.toISOString().slice(0, 10)),
  );
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let cursor = start.getTime();
  let remaining = minutes * 60000;
  const horizon = cursor + 366 * 2 * 86400000;
  while (remaining > 0 && cursor < horizon) {
    const parts = formatter.formatToParts(cursor);
    const part = (name: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === name)!.value;
    const date = `${part("year")}-${part("month")}-${part("day")}`;
    const weekday = weekdays.indexOf(part("weekday"));
    const minute = Number(part("hour")) * 60 + Number(part("minute"));
    const available = 60000 - (cursor % 60000);
    const working =
      !holidays.has(date) &&
      calendar.hours.some(
        (h) =>
          h.weekday === weekday &&
          h.startMinute <= minute &&
          minute < h.endMinute,
      );
    const step = working ? Math.min(available, remaining) : available;
    if (working) remaining -= step;
    cursor += step;
  }
  if (remaining > 0) throw new CalendarConfigurationError();
  return new Date(cursor);
}
