'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bookmark,
  Calendar,
  ChevronDown,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { SwipeCard, type Dir } from './swipe-card'
import { MediaFrame } from '@/components/media-frame'
import { CategoryGlyph } from '@/components/category'
import { ScheduleSheet } from '@/components/schedule-sheet'
import { BottomSheet } from '@/components/sheet'
import { useToast } from '@/components/toast'
import { ALL_CITIES, ALL_INTERESTS, EXPERIENCES, getExperience } from '@/lib/data'
import { rankExperiences } from '@/lib/helpers'
import { useTrip } from '@/lib/trip-context'
import type { Category, City } from '@/lib/types'
import { cn } from '@/lib/utils'

export function Deck() {
  const { hydrated, prefs, saved, passed, save, pass, undoLast } = useTrip()
  const { toast } = useToast()
  const router = useRouter()
  const reduce = useReducedMotion()

  const [activeCity, setActiveCity] = useState<City | 'All'>('All')
  const [activeCats, setActiveCats] = useState<Category[]>([])
  const [cityOpen, setCityOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [scheduleId, setScheduleId] = useState<string | null>(null)
  const [dir, setDir] = useState<Dir>(null)
  const [deckIds, setDeckIds] = useState<string[] | null>(null)
  const [undo, setUndo] = useState<{ id: string; msg: string } | null>(null)

  const seenRef = useRef<Set<string>>(new Set())
  seenRef.current = new Set([...saved, ...passed])

  const matchesFilters = useCallback(
    (city: City, tags: Category[]) => {
      if (prefs.cities.length && !prefs.cities.includes(city)) return false
      if (activeCity !== 'All' && city !== activeCity) return false
      if (activeCats.length && !tags.some((t) => activeCats.includes(t)))
        return false
      return true
    },
    [prefs.cities, activeCity, activeCats],
  )

  // Reset the working deck only when filters (not swipes) change.
  useEffect(() => {
    if (!hydrated) return
    const list = rankExperiences(
      EXPERIENCES.filter(
        (e) => !seenRef.current.has(e.id) && matchesFilters(e.city, e.tags),
      ),
      prefs,
    ).map((e) => e.id)
    setDeckIds(list)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, activeCity, activeCats, prefs.cities.join(), prefs.interests.join(), prefs.freeform])

  useEffect(() => {
    if (!undo) return
    const t = setTimeout(() => setUndo(null), 4000)
    return () => clearTimeout(t)
  }, [undo])

  const front = deckIds?.[0] ?? null

  const commit = useCallback(
    (d: 'left' | 'right') => {
      const id = deckIds?.[0]
      if (!id) return
      const exp = getExperience(id)!
      setDir(d)
      if (d === 'right') save(id)
      else pass(id)
      setDeckIds((ids) => (ids ? ids.slice(1) : ids))
      setUndo({
        id,
        msg: `${d === 'right' ? 'Saved' : 'Passed on'} ${exp.title}`,
      })
    },
    [deckIds, save, pass],
  )

  const doUndo = useCallback(() => {
    if (!undo) return
    undoLast()
    setDeckIds((ids) => [undo.id, ...(ids ?? [])])
    setUndo(null)
  }, [undo, undoLast])

  const doShare = useCallback(
    (id: string) => {
      const exp = getExperience(id)
      if (!exp) return
      const url = `${window.location.origin}/experience/${id}`
      if (navigator.share) {
        navigator.share({ title: exp.title, url }).catch(() => {})
      } else {
        navigator.clipboard?.writeText(url).catch(() => {})
        toast('Link copied to clipboard')
      }
    },
    [toast],
  )

  // Keyboard: ← pass  → save  ↑ add  Enter open  S share  Z undo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (cityOpen || filterOpen || scheduleId) return
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'))
        return
      const f = deckIds?.[0]
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          commit('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          commit('right')
          break
        case 'ArrowUp':
          e.preventDefault()
          if (f) setScheduleId(f)
          break
        case 'Enter':
          if (f) router.push(`/experience/${f}`)
          break
        case 's':
        case 'S':
          if (f) doShare(f)
          break
        case 'z':
        case 'Z':
          doUndo()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deckIds, cityOpen, filterOpen, scheduleId, commit, doUndo, doShare, router])

  const cityLabel = activeCity === 'All' ? 'All cities' : activeCity
  const stack = useMemo(() => (deckIds ?? []).slice(0, 3), [deckIds])

  return (
    <div className="relative flex h-full min-h-[100dvh] flex-col bg-void lg:min-h-0">
      {/* Floating top bar */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <button
          onClick={() => setCityOpen(true)}
          className="glass text-meta flex items-center gap-1.5 rounded-full py-2 pr-3 pl-4 text-cream"
        >
          {cityLabel}
          <ChevronDown className="size-4 opacity-70" strokeWidth={2} aria-hidden />
        </button>
        <button
          onClick={() => setFilterOpen(true)}
          aria-label="Filters"
          className="glass relative flex size-10 items-center justify-center rounded-full text-cream"
        >
          <SlidersHorizontal className="size-[18px]" strokeWidth={1.8} aria-hidden />
          {activeCats.length > 0 && (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-accent-lift" />
          )}
        </button>
      </div>

      {/* Card stack */}
      <div className="relative flex-1 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+64px)]">
        <div className="relative h-full w-full">
          {!hydrated || deckIds === null ? (
            <DeckSkeleton />
          ) : stack.length === 0 ? (
            <EmptyDeck
              onLoosen={() => {
                setActiveCats([])
                setActiveCity('All')
              }}
              onReview={() => router.push('/saved')}
            />
          ) : (
            <>
              {stack
                .slice(1)
                .reverse()
                .map((id, i) => {
                  // i is reversed index: back card first
                  const depth = stack.slice(1).length - i // 2 or 1
                  const exp = getExperience(id)!
                  return (
                    <motion.div
                      key={id}
                      aria-hidden
                      className="absolute inset-0"
                      initial={false}
                      animate={{
                        scale: depth === 2 ? 0.92 : 0.96,
                        y: depth === 2 ? 16 : 8,
                        opacity: 0.6,
                      }}
                      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                    >
                      <div className="media-scrim relative h-full w-full overflow-hidden rounded-[28px]">
                        <MediaFrame
                          posterUrl={exp.posterUrl}
                          videoUrl={null}
                          active={false}
                          alt=""
                          className="h-full w-full"
                        />
                        <div className="absolute inset-0 bg-void/40" />
                        <span className="glass absolute left-4 top-4 flex size-9 items-center justify-center rounded-full">
                          <CategoryGlyph
                            category={exp.tags[0]}
                            className="size-4 text-cream"
                          />
                        </span>
                      </div>
                    </motion.div>
                  )
                })}

              <AnimatePresence custom={dir} initial={false}>
                {front && (
                  <SwipeCard
                    key={front}
                    exp={getExperience(front)!}
                    dir={dir}
                    onCommit={commit}
                    onAdd={() => setScheduleId(front)}
                    onOpen={() => router.push(`/experience/${front}`)}
                  />
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Action row */}
      {front && (
        <div className="relative z-20 flex items-center justify-center gap-4 pb-3 pt-1">
          <ActionButton
            label="Pass"
            onClick={() => commit('left')}
            className="size-14 border border-glass-line text-cream"
          >
            <X className="size-6" strokeWidth={2} aria-hidden />
          </ActionButton>
          <ActionButton
            label="Save"
            onClick={() => commit('right')}
            className="size-14 bg-accent-red text-cream"
          >
            <Bookmark className="size-[22px]" strokeWidth={2} aria-hidden />
          </ActionButton>
          <ActionButton
            label="Add to itinerary"
            onClick={() => setScheduleId(front)}
            className="size-16 bg-cream text-void"
          >
            <Calendar className="size-7" strokeWidth={1.8} aria-hidden />
          </ActionButton>
          <ActionButton
            label="Share"
            onClick={() => doShare(front)}
            className="size-12 text-cream/55"
          >
            <Share2 className="size-5" strokeWidth={1.8} aria-hidden />
          </ActionButton>
        </div>
      )}

      {/* Undo pill */}
      <AnimatePresence>
        {undo && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+66px)] z-40 flex justify-center px-4"
          >
            <div className="glass text-meta flex max-w-full items-center gap-3 rounded-full py-2 pr-2 pl-4 text-cream">
              <span className="truncate">{undo.msg}</span>
              <button
                onClick={doUndo}
                className="text-label flex shrink-0 items-center gap-1 rounded-full bg-cream px-3 py-1.5 text-void"
              >
                <RotateCcw className="size-3.5" strokeWidth={2.2} aria-hidden />
                Undo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* City switcher */}
      <BottomSheet
        open={cityOpen}
        onClose={() => setCityOpen(false)}
        theme="dark"
        labelledBy="city-title"
      >
        <h2 id="city-title" className="text-title mb-4">
          Show experiences in
        </h2>
        <div className="flex flex-col gap-1.5 pb-2">
          {(['All', ...ALL_CITIES] as const).map((c) => {
            const selected = activeCity === c
            return (
              <button
                key={c}
                onClick={() => {
                  setActiveCity(c)
                  setCityOpen(false)
                }}
                className={cn(
                  'text-body flex items-center justify-between rounded-2xl px-4 py-3.5 text-left transition',
                  selected ? 'bg-accent-veil text-accent-lift' : 'bg-glass text-cream',
                )}
              >
                {c === 'All' ? 'All cities' : c}
                {selected && <span className="size-2 rounded-full bg-accent-lift" />}
              </button>
            )
          })}
        </div>
      </BottomSheet>

      {/* Filter sheet */}
      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        theme="dark"
        labelledBy="filter-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="filter-title" className="text-title">
            Filter by interest
          </h2>
          {activeCats.length > 0 && (
            <button
              onClick={() => setActiveCats([])}
              className="text-label text-accent-lift"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pb-2">
          {ALL_INTERESTS.map((cat) => {
            const on = activeCats.includes(cat)
            return (
              <button
                key={cat}
                onClick={() =>
                  setActiveCats((s) =>
                    on ? s.filter((x) => x !== cat) : [...s, cat],
                  )
                }
                className={cn(
                  'text-meta flex items-center gap-1.5 rounded-full border px-3.5 py-2 transition',
                  on
                    ? 'border-accent-lift bg-accent-veil text-accent-lift'
                    : 'border-glass-line text-cream/80',
                )}
              >
                <CategoryGlyph category={cat} className="size-3.5" />
                {cat}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setFilterOpen(false)}
          className="text-body mt-4 w-full rounded-full bg-cream py-3.5 font-medium text-void transition active:scale-[0.98]"
        >
          Show results
        </button>
      </BottomSheet>

      <ScheduleSheet
        experienceId={scheduleId}
        open={scheduleId !== null}
        onClose={() => setScheduleId(null)}
      />
    </div>
  )
}

function ActionButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'flex items-center justify-center rounded-full transition active:translate-y-px active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/50',
        className,
      )}
    >
      {children}
    </button>
  )
}

function DeckSkeleton() {
  return (
    <div className="relative h-full w-full">
      {[16, 8, 0].map((y, i) => (
        <div
          key={y}
          className="absolute inset-0 overflow-hidden rounded-[28px] bg-[#1a1714]"
          style={{
            transform: `translateY(${y}px) scale(${1 - i * 0.04})`,
            opacity: i === 2 ? 1 : 0.6,
          }}
        >
          {i === 2 && (
            <div className="absolute inset-0 animate-pulse">
              <div className="absolute bottom-6 left-6 right-10 space-y-3">
                <div className="h-9 w-3/4 rounded-lg bg-cream/10" />
                <div className="h-4 w-1/2 rounded bg-cream/10" />
                <div className="h-4 w-2/3 rounded bg-cream/10" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function EmptyDeck({
  onLoosen,
  onReview,
}: {
  onLoosen: () => void
  onReview: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-glass-line">
        <Bookmark className="size-7 text-cream/60" strokeWidth={1.5} aria-hidden />
      </div>
      <div className="space-y-2">
        <h2 className="text-title text-cream text-balance">
          That&apos;s everything matching your filters
        </h2>
        <p className="text-body text-cream-70">
          Loosen your filters or revisit what you&apos;ve saved.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2.5">
        <button
          onClick={onLoosen}
          className="text-body w-full rounded-full bg-cream py-3.5 font-medium text-void transition active:scale-[0.98]"
        >
          Loosen filters
        </button>
        <button
          onClick={onReview}
          className="text-body w-full rounded-full border border-glass-line py-3.5 font-medium text-cream transition active:scale-[0.98]"
        >
          Review your saves
        </button>
      </div>
    </div>
  )
}
