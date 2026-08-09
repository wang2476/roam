export type City = 'Tokyo' | 'Kyoto' | 'Osaka'

export type Category =
  | 'Food'
  | 'Nightlife'
  | 'Art'
  | 'Anime'
  | 'Music'
  | 'Nature'
  | 'Shopping'
  | 'Festivals'
  | 'Wellness'
  | 'Traditional'
  | 'Photography'
  | 'Architecture'
  | 'History'
  | 'Beaches'
  | 'Hiking'
  | 'Coffee'
  | 'Design'
  | 'Fashion'
  | 'Wellness Retreats'
  | 'Local Markets'
  | 'Language Exchange'
  | 'Film'
  | 'Sports'
  | 'Wildlife'
  | 'Sustainability'

export type Experience = {
  id: string
  title: string
  city: City
  neighborhood: string
  date: string // ISO date, within Mar 14–21 2026
  startTime: string // "19:00"
  durationMin: number
  description: string
  tags: Category[]
  matchReason: string
  host: { name: string; avatarUrl: string; verified: boolean }
  saveCount: number
  shareCount: number
  videoUrl: string | null
  posterUrl: string
  lat: number
  lng: number
  ageAccess: string
}

export type ScheduledItem = {
  id: string
  experienceId: string
  day: string // ISO date
  time: string // "19:00"
  note?: string
}

export type Preferences = {
  cities: City[]
  interests: Category[]
  freeform: string
  destinationContinents?: string[]
  destinationCountries?: string[]
}
