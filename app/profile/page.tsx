'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ChevronDown, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { Screen } from '@/components/screen'
import { CategoryGlyph } from '@/components/category'
import { AvatarMono } from '@/components/avatar-mono'
import { BottomSheet } from '@/components/sheet'
import { useToast } from '@/components/toast'
import { ALL_INTERESTS, EXPERIENCES, getExperience } from '@/lib/data'
import { formatDayLong, scoreExperience } from '@/lib/helpers'
import { useTrip } from '@/lib/trip-context'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

const PROFILE_NAME = 'Aya Nakamura'

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    hydrated,
    prefs,
    saved,
    passed,
    scheduled,
    setPrefs,
    restorePassed,
    resetDemoData,
  } = useTrip()

  const [about, setAbout] = useState(prefs.freeform)
  const [interests, setInterests] = useState<Category[]>(prefs.interests)
  const [showPassed, setShowPassed] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  // keep local mirrors in sync once storage hydrates
  const [synced, setSynced] = useState(false)
  if (hydrated && !synced) {
    setAbout(prefs.freeform)
    setInterests(prefs.interests)
    setSynced(true)
  }

  const planDays = useMemo(
    () => new Set(scheduled.map((s) => s.day)).size,
    [scheduled],
  )

  const subtitle = useMemo(
    () => `${prefs.cities.join(' \u00b7 ')} \u00b7 Mar 14\u201321`,
    [prefs.cities],
  )

  const dirty =
    about.trim() !== prefs.freeform.trim() ||
    interests.slice().sort().join() !== prefs.interests.slice().sort().join()

  const updateFeed = () => {
    const nextPrefs = { ...prefs, freeform: about, interests }
    // Count unseen experiences that score higher under the new preferences —
    // a real signal, not a fabricated number.
    const seen = new Set([...saved, ...passed])
    const gained = EXPERIENCES.filter((e) => {
      if (seen.has(e.id)) return false
      return scoreExperience(e, nextPrefs) > scoreExperience(e, prefs)
    }).length
    setPrefs({ freeform: about, interests })
    toast(
      gained > 0
        ? `Feed updated \u2014 ${gained} new ${gained === 1 ? 'match' : 'matches'}`
        : 'Feed updated',
      { label: 'Explore', href: '/explore' },
    )
  }

  const toggleInterest = (c: Category) =>
    setInterests((list) =>
      list.includes(c) ? list.filter((x) => x !== c) : [...list, c],
    )

  const passedItems = passed
    .map((id) => getExperience(id))
    .filter((e): e is NonNullable<ReturnType<typeof getExperience>> => Boolean(e))

  return (
    <Screen bg="base" showNav>
      <div className="flex flex-col pb-32">
        {/* Gradient identity band */}
        <header
          className="px-5 pb-7 pt-[max(28px,env(safe-area-inset-top))]"
          style={{
            background:
              'linear-gradient(160deg, #F7EAEC 0%, #FAF8F5 48%, #F2ECE3 100%)',
          }}
        >
          <div className="flex items-center gap-4">
            <AvatarMono name={PROFILE_NAME} className="size-16 text-title" />
            <div className="min-w-0">
              <h1 className="text-title leading-tight text-balance">
                {PROFILE_NAME}
              </h1>
              <p className="text-meta text-ink-60 mt-1 truncate">
                {hydrated ? subtitle : '\u00a0'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 flex items-stretch">
            <Stat value={saved.length} label="Saved" ready={hydrated} />
            <Divider />
            <Stat value={scheduled.length} label="Planned" ready={hydrated} />
            <Divider />
            <Stat value={planDays} label="Days" ready={hydrated} />
          </div>
        </header>

        <div className="flex flex-col gap-8 px-5 pt-7">
          {/* About you */}
          <section>
            <h2 className="text-label text-ink-60">About you</h2>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={4}
              placeholder="I love tiny jazz bars and vintage shops, and I'd rather avoid crowds&hellip;"
              className="text-body mt-3 w-full resize-none rounded-[20px] border border-line bg-surface p-4 outline-none placeholder:text-ink-30 focus:border-accent-red"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-meta text-ink-30">This shapes your feed</p>
              <button
                onClick={updateFeed}
                disabled={!dirty}
                className={cn(
                  'text-label inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 transition',
                  dirty
                    ? 'bg-ink text-cream active:scale-95'
                    : 'cursor-not-allowed bg-line text-ink-30',
                )}
              >
                <Sparkles className="size-3.5" strokeWidth={2} aria-hidden />
                Update my feed
              </button>
            </div>
          </section>

          {/* Interests */}
          <section>
            <h2 className="text-label text-ink-60">Interests</h2>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {ALL_INTERESTS.map((c) => {
                const on = interests.includes(c)
                return (
                  <motion.button
                    key={c}
                    onClick={() => toggleInterest(c)}
                    whileTap={{ scale: 1.04 }}
                    aria-pressed={on}
                    className={cn(
                      'text-body flex items-center gap-2 rounded-full border px-3.5 py-2 transition',
                      on
                        ? 'border-ink bg-ink text-cream'
                        : 'border-line bg-surface text-ink',
                    )}
                  >
                    <CategoryGlyph category={c} className="size-4" />
                    {c}
                  </motion.button>
                )
              })}
            </div>
          </section>

          {/* Passed experiences */}
          <section>
            <button
              onClick={() => setShowPassed((s) => !s)}
              aria-expanded={showPassed}
              className="flex w-full items-center justify-between py-1"
            >
              <span className="text-label text-ink-60">
                Passed experiences &middot; {passedItems.length}
              </span>
              <ChevronDown
                className={cn(
                  'size-4 text-ink-30 transition-transform',
                  showPassed && 'rotate-180',
                )}
                strokeWidth={2}
                aria-hidden
              />
            </button>

            <AnimatePresence initial={false}>
              {showPassed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  {passedItems.length === 0 ? (
                    <p className="text-meta text-ink-30 py-3">
                      You haven&apos;t passed on anything yet.
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-col divide-y divide-line">
                      {passedItems.map((exp) => (
                        <li
                          key={exp.id}
                          className="flex items-center gap-3 py-3"
                        >
                          <img
                            src={exp.posterUrl || '/placeholder.svg'}
                            alt=""
                            className="size-12 shrink-0 rounded-[12px] object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-body truncate font-medium">
                              {exp.title}
                            </p>
                            <p className="text-meta text-ink-60 truncate">
                              {exp.neighborhood} &middot;{' '}
                              {formatDayLong(exp.date)}
                            </p>
                          </div>
                          <button
                            onClick={() => restorePassed(exp.id)}
                            className="text-label shrink-0 rounded-full border border-line px-3.5 py-2 text-ink transition active:scale-95"
                          >
                            Restore
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Reset */}
          <section className="border-t border-line pt-6">
            <button
              onClick={() => setConfirmReset(true)}
              className="text-body flex items-center gap-2.5 font-medium text-accent-red"
            >
              <RotateCcw className="size-[18px]" strokeWidth={2} aria-hidden />
              Reset demo data
            </button>
            <p className="text-meta text-ink-30 mt-1.5">
              Clears saves, plans, and preferences on this device.
            </p>
          </section>

          {/* Dev settings */}
          <section className="border-t border-line pt-6">
            <p className="text-label text-ink-30">Dev settings</p>
            <button
              onClick={() => {
                resetDemoData()
                setSynced(false)
                router.push('/onboarding?restart=1')
              }}
              className="text-body mt-3 w-full rounded-full border border-line bg-surface py-3.5 font-medium text-ink transition active:scale-[0.98]"
            >
              Restart onboarding
            </button>
          </section>
        </div>
      </div>

      <BottomSheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        labelledBy="reset-title"
      >
        <div className="flex flex-col items-center pt-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-warn-tint text-warn">
            <TriangleAlert className="size-6" strokeWidth={1.8} aria-hidden />
          </span>
          <h3 id="reset-title" className="text-title mt-4">
            Reset demo data?
          </h3>
          <p className="text-body text-ink-60 mt-2 text-balance">
            This removes everything you&apos;ve saved and planned, and returns
            Roam to its starting state.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2.5">
            <button
              onClick={() => {
                resetDemoData()
                setSynced(false)
                setConfirmReset(false)
                toast('Demo data reset')
                router.push('/')
              }}
              className="text-body w-full rounded-full bg-accent-red py-3.5 font-medium text-cream transition active:scale-[0.98]"
            >
              Reset everything
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="text-body w-full rounded-full py-3.5 font-medium text-ink-60"
            >
              Keep my data
            </button>
          </div>
        </div>
      </BottomSheet>
    </Screen>
  )
}

function Stat({
  value,
  label,
  ready,
}: {
  value: number
  label: string
  ready: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="text-title tabular-nums">{ready ? value : '\u2014'}</span>
      <span className="text-label text-ink-60 mt-1">{label}</span>
    </div>
  )
}

function Divider() {
  return <span aria-hidden className="my-1 w-px bg-line" />
}
