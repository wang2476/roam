'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarPlus, Clock, Train, Trash2 } from 'lucide-react'
import { Screen } from '@/components/screen'
import { MediaFrame } from '@/components/media-frame'
import { MatchChip } from '@/components/match-chip'
import { CategoryGlyph } from '@/components/category'
import { ScheduleSheet } from '@/components/schedule-sheet'
import { TRIP_DAYS, getExperience } from '@/lib/data'
import {
  dayName,
  dayNum,
  formatTime,
  timeToMinutes,
  travelMinutes,
} from '@/lib/helpers'
import { useTrip } from '@/lib/trip-context'
import type { Experience, ScheduledItem } from '@/lib/types'
import { cn } from '@/lib/utils'

type Row = ScheduledItem & { exp: Experience; conflict: boolean }

export default function ItineraryPage() {
  const { hydrated, scheduled, removeScheduled } = useTrip()
  const router = useRouter()
  const [activeDay, setActiveDay] = useState<string>(TRIP_DAYS[0])
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const dayRefs = useRef<Record<string, HTMLElement | null>>({})

  const byDay = useMemo(() => {
    const map: Record<string, Row[]> = {}
    for (const day of TRIP_DAYS) map[day] = []
    for (const it of scheduled) {
      const exp = getExperience(it.experienceId)
      if (!exp || !map[it.day]) continue
      map[it.day].push({ ...it, exp, conflict: false })
    }
    for (const day of TRIP_DAYS) {
      const rows = map[day].sort(
        (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time),
      )
      for (let i = 0; i < rows.length; i++) {
        for (let j = i + 1; j < rows.length; j++) {
          const aStart = timeToMinutes(rows[i].time)
          const aEnd = aStart + rows[i].exp.durationMin
          const bStart = timeToMinutes(rows[j].time)
          const bEnd = bStart + rows[j].exp.durationMin
          if (aStart < bEnd && aEnd > bStart) {
            rows[i].conflict = true
            rows[j].conflict = true
          }
        }
      }
    }
    return map
  }, [scheduled])

  const activeDays = TRIP_DAYS.filter((d) => byDay[d].length > 0)
  const currentDay = activeDays[0] ?? TRIP_DAYS[0]

  useEffect(() => {
    const headers = Object.entries(dayRefs.current)
    if (headers.length === 0) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) {
          const day = (visible.target as HTMLElement).dataset.day
          if (day) setActiveDay(day)
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    )
    for (const [, el] of headers) if (el) obs.observe(el)
    return () => obs.disconnect()
  }, [scheduled])

  const scrollToDay = (day: string) => {
    dayRefs.current[day]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const empty = hydrated && scheduled.length === 0

  return (
    <Screen bg="base" showNav>
      <div className="flex flex-col pb-32">
        <header className="px-5 pt-[max(20px,env(safe-area-inset-top))]">
          <div className="pt-2">
            <p className="text-label text-ink-30">Your trip</p>
            <h1 className="text-display mt-1">Japan</h1>
            <p className="text-meta text-ink-60 mt-1">Mar 14&ndash;21, 2026</p>
          </div>
        </header>

        {/* Day strip */}
        <div className="no-scrollbar sticky top-0 z-30 mt-4 flex gap-2 overflow-x-auto bg-base/85 px-5 py-3 backdrop-blur-md">
          {TRIP_DAYS.map((d) => {
            const count = byDay[d].length
            const isActive = d === activeDay
            const isCurrent = d === currentDay
            return (
              <button
                key={d}
                onClick={() => scrollToDay(d)}
                className={cn(
                  'relative flex shrink-0 flex-col items-center rounded-2xl px-3.5 py-2 transition',
                  isActive ? 'bg-ink text-cream' : 'bg-surface text-ink',
                  isCurrent && !isActive && 'ring-1 ring-accent-red',
                )}
              >
                <span className="text-label tracking-normal normal-case opacity-70">
                  {dayName(d)}
                </span>
                <span className="text-body font-medium leading-tight">{dayNum(d)}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'mt-1 flex items-center gap-0.5',
                      isActive ? 'text-cream' : 'text-accent-red',
                    )}
                  >
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <span key={i} className="size-1 rounded-full bg-current" />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {empty ? (
          <ItineraryEmpty onGo={() => router.push('/saved')} />
        ) : !hydrated ? (
          <ItinerarySkeleton />
        ) : (
          <div className="px-5 pt-2">
            {activeDays.map((day) => (
              <section
                key={day}
                data-day={day}
                ref={(el) => {
                  dayRefs.current[day] = el
                }}
                className="scroll-mt-24"
              >
                <div className="sticky top-[76px] z-20 -mx-5 bg-base/85 px-5 py-2 backdrop-blur-md">
                  <h2 className="text-label text-ink-60">
                    {dayName(day)} &middot; Mar {dayNum(day)}
                  </h2>
                </div>

                <div className="relative pb-2 pl-11">
                  {/* rail */}
                  <span className="absolute left-[44px] top-2 bottom-6 w-px -translate-x-1/2 bg-line" />
                  {byDay[day].map((row, i) => (
                    <div key={row.id}>
                      <TimelineEntry
                        row={row}
                        past={day < currentDay}
                        onOpen={() => router.push(`/experience/${row.exp.id}`)}
                        onRemove={() => removeScheduled(row.id)}
                        onReschedule={() => {
                          removeScheduled(row.id)
                          setRescheduleId(row.exp.id)
                        }}
                      />
                      {i < byDay[day].length - 1 && (
                        <TravelConnector
                          from={byDay[day][i]}
                          to={byDay[day][i + 1]}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <DayFooter rows={byDay[day]} />
              </section>
            ))}
          </div>
        )}
      </div>

      <ScheduleSheet
        experienceId={rescheduleId}
        open={rescheduleId !== null}
        onClose={() => setRescheduleId(null)}
      />
    </Screen>
  )
}

function TimelineEntry({
  row,
  past,
  onOpen,
  onRemove,
  onReschedule,
}: {
  row: Row
  past: boolean
  onOpen: () => void
  onRemove: () => void
  onReschedule: () => void
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="relative py-2">
      {/* node on the rail (rail sits at pl-11 => 44px; card container offset) */}
      <span
        className={cn(
          'absolute -left-[27px] top-4 z-10 flex size-7 -translate-x-0 items-center justify-center rounded-full border-2',
          past
            ? 'border-line bg-base text-ink-30'
            : 'border-accent-red bg-accent-red text-cream',
          row.conflict && 'border-warn bg-warn',
        )}
      >
        <CategoryGlyph category={row.exp.tags[0]} className="size-3.5" />
      </span>

      {/* time */}
      <p className="text-label text-ink-60 absolute -left-[8px] top-[52px] w-14 -translate-x-full text-right tracking-normal normal-case">
        {formatTime(row.time)}
      </p>

      <div className="relative overflow-hidden rounded-[20px]">
        <div className="absolute inset-y-0 right-0 flex items-stretch">
          <button
            onClick={onReschedule}
            className="text-label flex w-20 flex-col items-center justify-center gap-1 bg-ink text-cream"
          >
            <Clock className="size-4" strokeWidth={2} aria-hidden />
            Reschedule
          </button>
          <button
            onClick={onRemove}
            className="text-label flex w-16 flex-col items-center justify-center gap-1 bg-accent-red text-cream"
          >
            <Trash2 className="size-4" strokeWidth={2} aria-hidden />
            Remove
          </button>
        </div>

        <motion.button
          drag="x"
          dragConstraints={{ left: -144, right: 0 }}
          dragElastic={0.08}
          onDragEnd={(_, info) => setRevealed(info.offset.x < -60)}
          animate={{ x: revealed ? -144 : 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          onClick={() => {
            if (revealed) setRevealed(false)
            else onOpen()
          }}
          className={cn(
            'relative flex w-full items-center gap-3 rounded-[20px] bg-surface p-3 text-left',
            row.conflict && 'border-l-4 border-warn',
          )}
          style={{ boxShadow: '0 1px 2px rgba(20,18,16,0.04), 0 6px 18px rgba(20,18,16,0.05)' }}
        >
          <div className="size-16 shrink-0 overflow-hidden rounded-2xl">
            <MediaFrame
              posterUrl={row.exp.posterUrl}
              videoUrl={null}
              active={false}
              alt={row.exp.title}
              className="h-full w-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-body truncate font-medium">{row.exp.title}</h3>
            </div>
            <p className="text-meta text-ink-60 mt-0.5 truncate">
              {row.exp.neighborhood} &middot; {row.exp.durationMin} min
            </p>
            {row.conflict && (
              <span className="text-label mt-1 inline-block text-warn">Overlaps</span>
            )}
            <MatchChip
              reason={row.exp.matchReason}
              variant="light"
              className="mt-1.5 w-fit"
            />
          </div>
        </motion.button>
      </div>
    </div>
  )
}

function TravelConnector({ from, to }: { from: Row; to: Row }) {
  const mins = travelMinutes(from.exp, to.exp)
  return (
    <div className="relative flex items-center gap-2 py-1 pl-1">
      <span className="absolute -left-[27px] top-0 bottom-0 w-px -translate-x-0 border-l border-dashed border-line" />
      <Train className="size-3.5 text-ink-30" strokeWidth={1.8} aria-hidden />
      <span className="text-label text-ink-30 tracking-normal normal-case">
        ~{mins} min by train
      </span>
    </div>
  )
}

function DayFooter({ rows }: { rows: Row[] }) {
  const hoods = Array.from(new Set(rows.map((r) => r.exp.neighborhood.split(',')[0])))
  return (
    <div className="text-meta text-ink-30 mb-6 mt-1 pl-11">
      {rows.length} {rows.length === 1 ? 'experience' : 'experiences'} &middot;{' '}
      {hoods.join(', ')}
    </div>
  )
}

function ItineraryEmpty({ onGo }: { onGo: () => void }) {
  return (
    <div className="relative mt-6 px-5">
      <div className="relative pl-11">
        <span className="absolute left-[44px] top-2 h-64 w-px -translate-x-1/2 bg-line/60" />
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute left-[44px] size-3 -translate-x-1/2 rounded-full border border-line bg-base"
            style={{ top: `${20 + i * 90}px` }}
          />
        ))}
      </div>
      <div className="mt-24 flex flex-col items-center gap-6 px-4 text-center">
        <div className="space-y-2">
          <h2 className="text-title text-balance">Your days are open</h2>
          <p className="text-body text-ink-60">Add something from Saved to start your plan.</p>
        </div>
        <button
          onClick={onGo}
          className="text-body inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-medium text-cream transition active:scale-[0.98]"
        >
          <CalendarPlus className="size-5" strokeWidth={1.8} aria-hidden />
          Go to Saved
        </button>
      </div>
    </div>
  )
}

function ItinerarySkeleton() {
  return (
    <div className="mt-4 space-y-4 px-5 pl-16">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex animate-pulse gap-3">
          <div className="size-16 shrink-0 rounded-2xl bg-line" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-3/4 rounded bg-line" />
            <div className="h-3 w-1/2 rounded bg-line" />
          </div>
        </div>
      ))}
    </div>
  )
}
