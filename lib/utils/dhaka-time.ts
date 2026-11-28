export function dhakaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatDhakaDate(value: string | Date, options: Intl.DateTimeFormatOptions = {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
}) {
  const source = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(source)
    ? new Date(`${source}T00:00:00+06:00`)
    : new Date(value);
  return date.toLocaleDateString(undefined, { ...options, timeZone: "Asia/Dhaka" });
}

export function formatDhakaTime(value: string | Date) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(value));
  if (!match) return String(value).slice(0, 5);
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
}
