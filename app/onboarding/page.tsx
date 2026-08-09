'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, Mic } from 'lucide-react'
import { Screen } from '@/components/screen'
import { MediaFrame } from '@/components/media-frame'
import { CategoryGlyph } from '@/components/category'
import { ALL_CITIES, ALL_INTERESTS, CITY_IMAGE } from '@/lib/data'
import { useTrip } from '@/lib/trip-context'
import type { Category, City } from '@/lib/types'
import { cn } from '@/lib/utils'

const GEN_STEPS = [
  'Reading your interests\u2026',
  'Finding local events in Tokyo\u2026',
  'Ranking 18 experiences\u2026',
]

export default function OnboardingPage() {
  const router = useRouter()
  const { completeOnboarding } = useTrip()

  const [step, setStep] = useState(0)
  const [cities, setCities] = useState<City[]>([])
  const [interests, setInterests] = useState<Category[]>([])
  const [freeform, setFreeform] = useState('')
  const [generating, setGenerating] = useState(false)

  const minMet =
    (step === 0 && cities.length >= 1) ||
    (step === 1 && interests.length >= 3) ||
    step === 2

  const finish = useCallback(() => {
    completeOnboarding({
      cities: cities.length ? cities : [...ALL_CITIES],
      interests,
      freeform,
    })
    setGenerating(true)
    setTimeout(() => router.push('/explore'), 1900)
  }, [cities, interests, freeform, completeOnboarding, router])

  const next = () => {
    if (step < 2) setStep((s) => s + 1)
    else finish()
  }

  if (generating) return <GeneratingScreen />

  return (
    <Screen bg="base">
      <div className="flex h-full min-h-[100dvh] flex-col px-5 pt-[max(16px,env(safe-area-inset-top))] lg:min-h-0">
        {/* progress + back */}
        <div className="flex items-center gap-3 pt-2">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              aria-label="Back"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line"
            >
              <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
            </button>
          ) : (
            <span className="size-9 shrink-0" />
          )}
          <div className="flex flex-1 gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i <= step ? 'bg-accent-red' : 'bg-line',
                )}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col pt-8"
          >
            {step === 0 && (
              <StepDestinations cities={cities} setCities={setCities} />
            )}
            {step === 1 && (
              <StepInterests interests={interests} setInterests={setInterests} />
            )}
            {step === 2 && (
              <StepFreeform
                value={freeform}
                setValue={setFreeform}
                onSkip={finish}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <div className="sticky bottom-0 bg-base pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
          <button
            onClick={next}
            disabled={!minMet}
            className={cn(
              'text-body w-full rounded-full py-4 font-medium transition',
              minMet
                ? 'bg-ink text-cream active:scale-[0.98]'
                : 'cursor-not-allowed bg-line text-ink-30',
            )}
          >
            Continue
          </button>
        </div>
      </div>
    </Screen>
  )
}

function StepDestinations({
  cities,
  setCities,
}: {
  cities: City[]
  setCities: (c: City[]) => void
}) {
  const toggle = (c: City) =>
    setCities(cities.includes(c) ? cities.filter((x) => x !== c) : [...cities, c])
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-display text-balance">Where are you headed?</h1>
      <p className="text-body text-ink-60 mt-2">Pick one or more. You can change this later.</p>
      <div className="mt-6 flex flex-1 flex-col gap-3">
        {ALL_CITIES.map((c) => {
          const on = cities.includes(c)
          return (
            <button
              key={c}
              onClick={() => toggle(c)}
              className={cn(
                'relative flex-1 overflow-hidden rounded-[24px] border-2 transition',
                on ? 'border-accent-red' : 'border-transparent',
              )}
            >
              <MediaFrame
                posterUrl={CITY_IMAGE[c]}
                videoUrl={null}
                active={false}
                alt={c}
                className={cn('h-full w-full transition', on ? 'saturate-50' : '')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void/70 to-transparent" />
              <span className="text-title absolute bottom-4 left-4 text-cream">{c}</span>
              {on && (
                <span className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-accent-red text-cream">
                  <Check className="size-5" strokeWidth={2.6} aria-hidden />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepInterests({
  interests,
  setInterests,
}: {
  interests: Category[]
  setInterests: (c: Category[]) => void
}) {
  const toggle = (c: Category) =>
    setInterests(
      interests.includes(c) ? interests.filter((x) => x !== c) : [...interests, c],
    )
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-display text-balance">What are you into?</h1>
      <p className="text-body text-ink-60 mt-2">
        {interests.length} of {ALL_INTERESTS.length} selected &middot; pick at least 3
      </p>
      <div className="mt-6 flex flex-wrap gap-2.5">
        {ALL_INTERESTS.map((c) => {
          const on = interests.includes(c)
          return (
            <motion.button
              key={c}
              onClick={() => toggle(c)}
              whileTap={{ scale: 1.04 }}
              className={cn(
                'text-body flex items-center gap-2 rounded-full border px-4 py-2.5 transition',
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
    </div>
  )
}

function StepFreeform({
  value,
  setValue,
  onSkip,
}: {
  value: string
  setValue: (v: string) => void
  onSkip: () => void
}) {
  const [listening, setListening] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const recRef = useRef<any>(null)

  const startVoice = () => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setUnavailable(true)
      setTimeout(() => setUnavailable(false), 2600)
      return
    }
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
      setValue(value ? `${value} ${text}` : text)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  const stopVoice = () => {
    recRef.current?.stop()
    setListening(false)
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-display text-balance">Tell us more</h1>
      <p className="text-body text-ink-60 mt-2">
        The more specific, the better your matches.
      </p>

      <div className="relative mt-6 flex-1">
        {listening ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-4 rounded-[24px] border border-line bg-surface">
            <Waveform />
            <p className="text-body text-ink-60">Listening&hellip;</p>
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="I love tiny jazz bars and vintage shops, and I'd rather avoid crowds&hellip;"
            className="text-body h-full min-h-48 w-full resize-none rounded-[24px] border border-line bg-surface p-4 pr-16 outline-none placeholder:text-ink-30 focus:border-accent-red"
          />
        )}

        <button
          onClick={listening ? stopVoice : startVoice}
          aria-label={listening ? 'Stop listening' : 'Dictate with voice'}
          className={cn(
            'absolute right-3 top-3 flex size-11 items-center justify-center rounded-full transition',
            listening ? 'bg-accent-red text-cream' : 'bg-accent-tint text-accent-red',
          )}
        >
          <Mic className="size-5" strokeWidth={2} aria-hidden />
        </button>

        {unavailable && (
          <div className="text-meta absolute right-3 top-16 rounded-xl bg-ink px-3 py-2 text-cream shadow-lg">
            Voice unavailable &mdash; type instead
          </div>
        )}
      </div>

      <button onClick={onSkip} className="text-meta text-ink-60 mt-4 self-center py-1">
        Skip for now
      </button>
    </div>
  )
}

function Waveform() {
  return (
    <div className="flex items-end gap-1.5" aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full bg-accent-red"
          animate={{ height: [8, 28, 8] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
          style={{ height: 8 }}
        />
      ))}
    </div>
  )
}

function GeneratingScreen() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const a = setTimeout(() => setI(1), 600)
    const b = setTimeout(() => setI(2), 1200)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [])
  return (
    <Screen bg="void">
      <div className="flex h-full min-h-[100dvh] flex-col items-center justify-center gap-8 px-10 text-center lg:min-h-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
          className="size-14 rounded-full border-2 border-glass-line border-t-accent-lift"
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-body text-cream"
          >
            {GEN_STEPS[i]}
          </motion.p>
        </AnimatePresence>
      </div>
    </Screen>
  )
}
