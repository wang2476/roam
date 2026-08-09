import type { Experience } from './types'

type CalendarRow = { day: string; time: string; exp: Experience }

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toICSDate(iso: string, time: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return `${y}${pad(m)}${pad(d)}T${pad(h)}${pad(min)}00`
}

function addMinutesICS(iso: string, time: string, minutes: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  const date = new Date(y, m - 1, d, h, min + minutes)
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`
}

function escapeICS(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

export function buildICS(rows: CalendarRow[]) {
  const now = new Date()
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

  const events = rows.map((row) => {
    const start = toICSDate(row.day, row.time)
    const end = addMinutesICS(row.day, row.time, row.exp.durationMin)
    return [
      'BEGIN:VEVENT',
      `UID:${row.exp.id}-${row.day}-${row.time.replace(':', '')}@roam`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeICS(row.exp.title)}`,
      `LOCATION:${escapeICS(`${row.exp.neighborhood}, ${row.exp.city}`)}`,
      `DESCRIPTION:${escapeICS(row.exp.description)}`,
      'END:VEVENT',
    ].join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Roam//Itinerary//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadICS(filename: string, rows: CalendarRow[]) {
  if (rows.length === 0) return
  const ics = buildICS(rows)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
