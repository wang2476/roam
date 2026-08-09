'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import { Plus, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { Screen } from '@/components/screen'
import { MediaFrame } from '@/components/media-frame'
import { ScheduleSheet } from '@/components/schedule-sheet'
import { BuildOverlay } from '@/components/saved/build-overlay'
import { ItineraryPreferences } from '@/components/saved/itinerary-preferences'
import { getExperience } from '@/lib/data'
import { useTrip } from '@/lib/trip-context'
import type { City, Experience } from '@/lib/types'
import { cn } from '@/lib/utils'

type Sort = 'recent' | 'date'
const CITY_TABS: (City | 'All')[] = ['All', 'Tokyo', 'Kyoto', 'Osaka']

export default function SavedPage() {
  const router = useRouter()
  const { hydrated, saved, unsave } = useTrip()
  const [cityTab, setCityTab] = useState<City | 'All'>('All')
  const [sort, setSort] = useState<Sort>('recent')
  const [scheduleId, setScheduleId] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  const items = useMemo(() => {
    const list = saved
      .map((id) => getExperience(id))
      .filter((e): e is Experience => Boolean(e))
      .filter((e) => cityTab === 'All' || e.city === cityTab)
    if (sort === 'date') {
      return [...list].sort(
        (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
      )
    }
    return list // saved is already newest-first
  }, [saved, cityTab, sort])

  return (
    <Screen bg="base" showNav>
      <div className="flex flex-col px-5 pb-32 pt-[max(20px,env(safe-area-inset-top))]">
        <header className="pt-2">
          <h1 className="text-display">Saved</h1>
          <p className="text-meta text-ink-60 mt-1">
            {hydrated ? `${saved.length} experiences` : '\u00a0'}
          </p>
        </header>

        {/* Filter + sort */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {CITY_TABS.map((c) => (
              <button
                key={c}
                onClick={() => setCityTab(c)}
                className={cn(
                  'text-meta shrink-0 rounded-full px-3.5 py-1.5 transition',
                  cityTab === c
                    ? 'bg-ink text-cream'
                    : 'bg-surface text-ink-60 border border-line',
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSort((s) => (s === 'recent' ? 'date' : 'recent'))}
            className="text-meta text-ink-60 shrink-0 whitespace-nowrap"
          >
            {sort === 'recent' ? 'Recently saved' : 'By date'}
          </button>
        </div>

        {!hydrated ? (
          <SavedSkeleton />
        ) : saved.length === 0 ? (
          <SavedEmpty />
        ) : (
          <>
            {/* AI moment */}
            <button
              onClick={() => setPreferencesOpen(true)}
              className="relative mt-5 overflow-hidden rounded-[28px] p-5 text-left"
              style={{
                background:
                  'linear-gradient(135deg, #F7EAEC 0%, #FAF8F5 55%, #F3ECE2 100%)',
              }}
            >
              <div className="relative flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-red text-cream">
                  <Wand2 className="size-6" strokeWidth={1.8} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-title leading-tight text-ink text-balance">
                    Turn {saved.length} saves into a day-by-day plan
                  </p>
                </div>
              </div>
              <span className="text-label mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-cream">
                <Sparkles className="size-3.5" strokeWidth={2} aria-hidden />
                Build my itinerary
              </span>
            </button>

            {/* Even saved-card grid */}
            <div className="mt-4 grid grid-cols-2 items-stretch gap-3">
              {items.map((exp) => (
                <SavedCard
                  key={exp.id}
                  exp={exp}
                  onOpen={() => router.push(`/experience/${exp.id}`)}
                  onSchedule={() => setScheduleId(exp.id)}
                  onRemove={() => unsave(exp.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ScheduleSheet
        experienceId={scheduleId}
        open={scheduleId !== null}
        onClose={() => setScheduleId(null)}
      />

      <ItineraryPreferences
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        onBuild={() => {
          setPreferencesOpen(false)
          setBuilding(true)
        }}
      />
      <BuildOverlay open={building} onClose={() => setBuilding(false)} />
    </Screen>
  )
}

function SavedCard({
  exp,
  onOpen,
  onSchedule,
  onRemove,
}: {
  exp: Experience
  onOpen: () => void
  onSchedule: () => void
  onRemove: () => void
}) {
  const [revealed, setRevealed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startPress = () => {
    timer.current = setTimeout(() => setRevealed(true), 500)
  }
  const cancelPress = () => {
    if (timer.current) clearTimeout(timer.current)
  }

  return (
    <div
      className="flex min-h-0 h-full flex-col overflow-hidden rounded-[20px] bg-surface"
      style={{ boxShadow: '0 1px 2px rgba(20,18,16,0.04), 0 8px 24px rgba(20,18,16,0.06)' }}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onOpen()
      }}
    >
      <div className="relative aspect-[4/3] w-full shrink-0">
        <MediaFrame
          posterUrl={exp.posterUrl}
          videoUrl={exp.videoUrl}
          active={false}
          alt={exp.title}
          className="h-full w-full"
        />
        <button
          onClick={(event) => {
            event.stopPropagation()
            onSchedule()
          }}
          aria-label={`Add ${exp.title} to itinerary`}
          className="absolute right-2.5 top-2.5 flex size-9 items-center justify-center rounded-full bg-cream/90 text-void backdrop-blur-sm transition active:scale-90"
        >
          <Plus className="size-5" strokeWidth={2.2} aria-hidden />
        </button>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-void/70 p-4 backdrop-blur-sm"
            >
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  setRevealed(false)
                  onRemove()
                }}
                className="text-label flex items-center gap-2 rounded-full bg-accent-red px-4 py-2.5 text-cream"
              >
                <Trash2 className="size-4" strokeWidth={2} aria-hidden />
                Remove
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  setRevealed(false)
                }}
                className="text-label text-cream/80"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex min-h-24 flex-1 flex-col gap-1.5 p-3">
        <h3 className="text-body line-clamp-2 min-h-10 font-medium leading-snug text-balance">{exp.title}</h3>
        <p className="text-meta mt-auto line-clamp-1 text-ink-60">{exp.neighborhood}</p>
      </div>
    </div>
  )
}

function SavedSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-[20px] bg-surface"
        >
          <div className="aspect-[4/3] w-full bg-line" />
          <div className="space-y-2 p-3.5">
            <div className="h-4 w-3/4 rounded bg-line" />
            <div className="h-3 w-1/2 rounded bg-line" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SavedEmpty() {
  const router = useRouter()
  return (
    <div className="mt-24 flex flex-col items-center gap-6 px-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-line">
        <Sparkles className="size-7 text-ink-30" strokeWidth={1.5} aria-hidden />
      </div>
      <div className="space-y-2">
        <h2 className="text-title text-balance">Nothing saved yet</h2>
        <p className="text-body text-ink-60">Swipe right on something you like.</p>
      </div>
      <button
        onClick={() => router.push('/explore')}
        className="text-body rounded-full bg-ink px-6 py-3.5 font-medium text-cream transition active:scale-[0.98]"
      >
        Go to Explore
      </button>
    </div>
  )
}
