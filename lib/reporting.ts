import { z } from "zod";

export const REPORT_ZONE = "America/Sao_Paulo";
export class ReportLimitError extends Error {}
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: REPORT_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function reportDay(date: Date) {
  const p = dayFormatter.formatToParts(date),
    get = (key: string) => p.find((v) => v.type === key)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function shiftDay(day: string, amount: number) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}
/** First instant of a calendar date in São Paulo, including a skipped midnight at DST. */
export function reportDayStart(day: string) {
  const center = new Date(`${day}T00:00:00Z`).getTime();
  let low = center - 36 * 3600000,
    high = center + 36 * 3600000;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (reportDay(new Date(mid)) < day) low = mid + 1;
    else high = mid;
  }
  return new Date(low);
}
export const reportFilterSchema = z.object({
  from: z.union([z.iso.date(), z.literal("")]).default(""),
  to: z.union([z.iso.date(), z.literal("")]).default(""),
  company: z.string().trim().max(200).default(""),
  priority: z.enum(["", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).default(""),
  level: z.enum(["", "N1", "N2", "N3"]).default(""),
  department: z.string().max(200).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export type ReportFilters = z.infer<typeof reportFilterSchema>;
export function reportingPeriod(
  raw: Record<string, unknown>,
  now = new Date(),
) {
  const parsed = reportFilterSchema.safeParse(raw),
    fallback = reportFilterSchema.parse({});
  const filters = parsed.success ? parsed.data : fallback,
    today = reportDay(now);
  const from = filters.from || shiftDay(today, -29),
    to = filters.to || today;
  const days =
    Math.round(
      (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) /
        86400000,
    ) + 1;
  const error = !parsed.success
    ? "Revise os filtros informados."
    : days < 1 || days > 366 || from < "2000-01-01" || to > "2100-12-31"
      ? "Escolha um período de 1 a 366 dias, entre os anos 2000 e 2100."
      : null;
  const start = reportDayStart(from),
    end = reportDayStart(shiftDay(to, 1)),
    previousStart = reportDayStart(shiftDay(from, -Math.max(1, days)));
  return {
    filters: { ...filters, from, to },
    error,
    start,
    end,
    previousStart,
    previousEnd: start,
    days,
  };
}
export function average(values: number[]) {
  return values.length
    ? values.reduce((a, b) => a + b, 0) / values.length
    : null;
}
export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b),
    i = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[i] : (sorted[i - 1] + sorted[i]) / 2;
}
export function csvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function csvLine(values: unknown[]) {
  return values.map(csvCell).join(";") + "\r\n";
}
