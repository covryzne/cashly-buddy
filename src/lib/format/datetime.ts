export function wibDateTime(date: string, time: string) {
  return `${date}T${time.length === 5 ? `${time}:00` : time}+07:00`;
}

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    ...options,
  }).format(new Date(value));
}
