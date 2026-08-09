'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { EXPERIENCES, TRIP_DAYS, getExperience } from './data'
import { minutesToTime, timeToMinutes, travelMinutes } from './helpers'
import type { City, Preferences, ScheduledItem } from './types'

type UndoEntry =
  | { kind: 'save'; id: string }
  | { kind: 'pass'; id: string }
  | { kind: 'schedule'; scheduledId: string }

type TripState = {
  prefs: Preferences
  saved: string[]
  passed: string[]
  scheduled: ScheduledItem[]
  onboarded: boolean
}

type TripContextValue = TripState & {
  hydrated: boolean
  setPrefs: (p: Partial<Preferences>) => void
  completeOnboarding: (p: Preferences) => void
  save: (id: string) => void
  pass: (id: string) => void
  unsave: (id: string) => void
  restorePassed: (id: string) => void
  schedule: (item: Omit<ScheduledItem, 'id'>) => ScheduledItem
  updateScheduled: (id: string, patch: Partial<ScheduledItem>) => void
  removeScheduled: (id: string) => void
  buildItinerary: () => { count: number; days: number }
  undoLast: () => UndoEntry | null
  canUndo: boolean
  loadDemoProfile: () => void
  resetDemoData: () => void
}

const STORAGE_KEY = 'ikou-trip-v1'

const DEFAULT_PREFS: Preferences = {
  cities: ['Tokyo', 'Kyoto', 'Osaka'],
  interests: ['Food', 'Music', 'Traditional'],
  freeform: '',
}

const DEMO_PREFS: Preferences = {
  cities: ['Tokyo', 'Kyoto', 'Osaka'],
  interests: ['Food', 'Nightlife', 'Music', 'Nature', 'Traditional', 'Shopping'],
  freeform:
    "I love tiny jazz bars and vintage shops, and I'd rather avoid crowds. Street food over fancy dinners every time.",
}

const DEMO_SAVED = [
  'ameyoko',
  'golden-gai',
  'fushimi-inari',
  'nakano',
  'dotonbori',
  'kiyomizu',
  'tsukiji',
  'arashiyama',
  'gion',
  'shibuya-sky',
  'namba-jazz',
  'pontocho',
]

const EMPTY: TripState = {
  prefs: DEFAULT_PREFS,
  saved: [],
  passed: [],
  scheduled: [],
  onboarded: false,
}

const TripContext = createContext<TripContextValue | null>(null)

let idCounter = 0
const newId = () => `s_${Date.now().toString(36)}_${idCounter++}`

// Real placement: keep each experience near its own date & time,
// group by neighborhood, cap 3/day, resolve time overlaps.
function generatePlan(savedIds: string[]): ScheduledItem[] {
  const exps = savedIds
    .map((id) => getExperience(id))
    .filter(Boolean)
    .sort((a, b) => {
      const d = a!.date.localeCompare(b!.date)
      if (d !== 0) return d
      // cluster same neighborhood together, then by time
      const n = a!.neighborhood.localeCompare(b!.neighborhood)
      if (n !== 0) return n
      return timeToMinutes(a!.startTime) - timeToMinutes(b!.startTime)
    })

  const buckets: Record<string, ScheduledItem[]> = {}
  for (const day of TRIP_DAYS) buckets[day] = []

  for (const exp of exps) {
    if (!exp) continue
    const startIdx = Math.max(0, TRIP_DAYS.indexOf(exp.date))
    // pick the first day from its own date forward with < 3 items
    let targetDay = exp.date
    for (let i = 0; i < TRIP_DAYS.length; i++) {
      const day = TRIP_DAYS[(startIdx + i) % TRIP_DAYS.length]
      if (buckets[day].length < 3) {
        targetDay = day
        break
      }
    }

    // resolve overlap on the target day
    let start = timeToMinutes(exp.startTime)
    const bucket = buckets[targetDay]
    let moved = true
    while (moved) {
      moved = false
      for (const it of bucket) {
        const other = getExperience(it.experienceId)!
        const oStart = timeToMinutes(it.time)
        const oEnd = oStart + other.durationMin
        if (start < oEnd && start + exp.durationMin > oStart) {
          const travel = travelMinutes(other, exp)
          start = oEnd + travel
          moved = true
        }
      }
    }

    bucket.push({
      id: newId(),
      experienceId: exp.id,
      day: targetDay,
      time: minutesToTime(start),
    })
  }

  return Object.values(buckets)
    .flat()
    .sort(
      (a, b) =>
        a.day.localeCompare(b.day) || timeToMinutes(a.time) - timeToMinutes(b.time),
    )
}

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TripState>(EMPTY)
  const [hydrated, setHydrated] = useState(false)
  const undoStack = useRef<UndoEntry[]>([])
  const [canUndo, setCanUndo] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as TripState
        setState({ ...EMPTY, ...parsed })
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore quota errors
    }
  }, [state, hydrated])

  const pushUndo = useCallback((entry: UndoEntry) => {
    undoStack.current.push(entry)
    if (undoStack.current.length > 20) undoStack.current.shift()
    setCanUndo(true)
  }, [])

  const setPrefs = useCallback((p: Partial<Preferences>) => {
    setState((s) => ({ ...s, prefs: { ...s.prefs, ...p } }))
  }, [])

  const completeOnboarding = useCallback((p: Preferences) => {
    setState((s) => ({ ...s, prefs: p, onboarded: true }))
  }, [])

  const save = useCallback(
    (id: string) => {
      setState((s) =>
        s.saved.includes(id)
          ? s
          : { ...s, saved: [id, ...s.saved], passed: s.passed.filter((p) => p !== id) },
      )
      pushUndo({ kind: 'save', id })
    },
    [pushUndo],
  )

  const pass = useCallback(
    (id: string) => {
      setState((s) =>
        s.passed.includes(id) ? s : { ...s, passed: [id, ...s.passed] },
      )
      pushUndo({ kind: 'pass', id })
    },
    [pushUndo],
  )

  const unsave = useCallback((id: string) => {
    setState((s) => ({ ...s, saved: s.saved.filter((x) => x !== id) }))
  }, [])

  const restorePassed = useCallback((id: string) => {
    setState((s) => ({ ...s, passed: s.passed.filter((x) => x !== id) }))
  }, [])

  const schedule = useCallback(
    (item: Omit<ScheduledItem, 'id'>) => {
      const full: ScheduledItem = { ...item, id: newId() }
      setState((s) => ({
        ...s,
        scheduled: [...s.scheduled, full],
        saved: s.saved.includes(item.experienceId)
          ? s.saved
          : [item.experienceId, ...s.saved],
      }))
      pushUndo({ kind: 'schedule', scheduledId: full.id })
      return full
    },
    [pushUndo],
  )

  const updateScheduled = useCallback(
    (id: string, patch: Partial<ScheduledItem>) => {
      setState((s) => ({
        ...s,
        scheduled: s.scheduled.map((it) =>
          it.id === id ? { ...it, ...patch } : it,
        ),
      }))
    },
    [],
  )

  const removeScheduled = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      scheduled: s.scheduled.filter((it) => it.id !== id),
    }))
  }, [])

  const buildItinerary = useCallback(() => {
    let result = { count: 0, days: 0 }
    setState((s) => {
      const plan = generatePlan(s.saved)
      result = {
        count: plan.length,
        days: new Set(plan.map((p) => p.day)).size,
      }
      return { ...s, scheduled: plan }
    })
    return result
  }, [])

  const undoLast = useCallback((): UndoEntry | null => {
    const entry = undoStack.current.pop()
    setCanUndo(undoStack.current.length > 0)
    if (!entry) return null
    setState((s) => {
      if (entry.kind === 'save')
        return { ...s, saved: s.saved.filter((x) => x !== entry.id) }
      if (entry.kind === 'pass')
        return { ...s, passed: s.passed.filter((x) => x !== entry.id) }
      return {
        ...s,
        scheduled: s.scheduled.filter((x) => x.id !== entry.scheduledId),
      }
    })
    return entry
  }, [])

  const loadDemoProfile = useCallback(() => {
    undoStack.current = []
    setCanUndo(false)
    setState({
      prefs: DEMO_PREFS,
      saved: DEMO_SAVED,
      passed: [],
      scheduled: [],
      onboarded: true,
    })
  }, [])

  const resetDemoData = useCallback(() => {
    undoStack.current = []
    setCanUndo(false)
    setState(EMPTY)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo<TripContextValue>(
    () => ({
      ...state,
      hydrated,
      canUndo,
      setPrefs,
      completeOnboarding,
      save,
      pass,
      unsave,
      restorePassed,
      schedule,
      updateScheduled,
      removeScheduled,
      buildItinerary,
      undoLast,
      loadDemoProfile,
      resetDemoData,
    }),
    [
      state,
      hydrated,
      canUndo,
      setPrefs,
      completeOnboarding,
      save,
      pass,
      unsave,
      restorePassed,
      schedule,
      updateScheduled,
      removeScheduled,
      buildItinerary,
      undoLast,
      loadDemoProfile,
      resetDemoData,
    ],
  )

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTrip() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('useTrip must be used within TripProvider')
  return ctx
}

export { EXPERIENCES }

export function useDeck() {
  const { prefs, saved, passed } = useTrip()
  return useMemo(() => {
    const seen = new Set([...saved, ...passed])
    return EXPERIENCES.filter((e) => {
      if (seen.has(e.id)) return false
      if (prefs.cities.length && !prefs.cities.includes(e.city)) return false
      return true
    })
  }, [prefs.cities, saved, passed])
}
