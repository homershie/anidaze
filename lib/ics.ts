import { toUTCZ } from "./time";

export type IcsEvent = {
  uid: string;
  start: Date; // UTC date
  end: Date; // UTC date
  summary: string;
  url?: string;
  description?: string;
  location?: string;
  rrule?: string; // e.g., FREQ=WEEKLY;BYDAY=MO
};

export function buildICS(events: IcsEvent[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AniDaze//anidaze.app//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeText(e.uid)}`);
    lines.push(`DTSTAMP:${toUTCZ(new Date())}`);
    lines.push(`DTSTART:${toUTCZ(e.start)}`);
    lines.push(`DTEND:${toUTCZ(e.end)}`);
    lines.push(`SUMMARY:${escapeText(e.summary)}`);
    if (e.url) lines.push(`URL:${escapeText(e.url)}`);
    if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
    if (e.location) lines.push(`LOCATION:${escapeText(e.location)}`);
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function escapeText(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/[,;]/g, (m) => `\\${m}`);
}
