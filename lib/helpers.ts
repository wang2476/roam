import type { Category, Experience, Preferences } from './types'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function dayName(iso: string) {
  return DOW[parseISO(iso).getDay()]
}

export function dayNum(iso: string) {
  return parseISO(iso).getDate()
}

export function formatDayShort(iso: string) {
  return `${dayName(iso)} ${dayNum(iso)}`
}

export function formatDayLong(iso: string) {
  const d = parseISO(iso)
  return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`
}

export function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(min: number) {
  const clamped = ((min % 1440) + 1440) % 1440
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Haversine-based train-time heuristic between two coordinates.
export function travelMinutes(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  const km = 2 * R * Math.asin(Math.sqrt(h))
  // ~35 km/h effective incl. transfers/walk, floor of 6 min
  return Math.max(6, Math.round((km / 35) * 60) + 5)
}

// Ranking: overlap of tags with interests, city match, freeform keyword hits.
const KEYWORDS: { re: RegExp; tags: Category[] }[] = [
  { re: /jazz|music|vinyl|record/i, tags: ['Music', 'Nightlife'] },
  { re: /street food|food|eat|market|ramen|sushi/i, tags: ['Food'] },
  { re: /vintage|thrift|antique|second.?hand/i, tags: ['Shopping'] },
  { re: /crowd|quiet|calm|peace/i, tags: ['Nature', 'Wellness'] },
  { re: /anime|manga|arcade|game/i, tags: ['Anime'] },
  { re: /art|museum|gallery|design/i, tags: ['Art'] },
  { re: /temple|shrine|tradition|tea|kimono/i, tags: ['Traditional'] },
]

export function scoreExperience(exp: Experience, prefs: Preferences) {
  let score = 0
  if (prefs.cities.includes(exp.city)) score += 3
  for (const tag of exp.tags) {
    if (prefs.interests.includes(tag)) score += 2
  }
  for (const { re, tags } of KEYWORDS) {
    if (re.test(prefs.freeform)) {
      for (const tag of tags) if (exp.tags.includes(tag)) score += 1
    }
  }
  return score
}

export function rankExperiences(exps: Experience[], prefs: Preferences) {
  return [...exps]
    .map((e) => ({ e, s: scoreExperience(e, prefs) }))
    .sort((a, b) => b.s - a.s || a.e.date.localeCompare(b.e.date))
    .map((x) => x.e)
}
