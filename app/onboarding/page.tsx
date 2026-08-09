'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronLeft, Mic, Search } from 'lucide-react'
import { Screen } from '@/components/screen'
import { CategoryGlyph } from '@/components/category'
import { ALL_CITIES, CORE_INTERESTS, SEARCH_INTERESTS, EXPERIENCES } from '@/lib/data'
import { useTrip } from '@/lib/trip-context'
import type { Category } from '@/lib/types'

const CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'] as const
const COUNTRIES: Record<(typeof CONTINENTS)[number], string[]> = {
  Africa: ['Egypt', 'Kenya', 'Morocco', 'Nigeria', 'South Africa', 'Tanzania'],
  Asia: ['China', 'India', 'Indonesia', 'Japan', 'South Korea', 'Thailand', 'Vietnam'],
  Europe: ['France', 'Germany', 'Greece', 'Italy', 'Portugal', 'Spain', 'United Kingdom'],
  'North America': ['Canada', 'Costa Rica', 'Cuba', 'Mexico', 'United States'],
  'South America': ['Argentina', 'Brazil', 'Chile', 'Colombia', 'Peru'],
  Oceania: ['Australia', 'Fiji', 'New Zealand', 'Samoa'],
}
const CONTINENT_IMAGES: Record<(typeof CONTINENTS)[number], string> = {
  Africa: '/onboarding/africa.png',
  Asia: '/onboarding/asia.png',
  Europe: '/onboarding/europe.png',
  'North America': '/onboarding/north-america.png',
  'South America': '/onboarding/south-america.png',
  Oceania: '/onboarding/oceania.png',
}
import { cn } from '@/lib/utils'

const GEN_STEPS = [
  'Reading your interests\u2026',
  'Finding local events in Tokyo\u2026',
  'Ranking 18 experiences\u2026',
]

export default function OnboardingPage() {
  const router = useRouter()
  const { completeOnboarding } = useTrip()

  const [showLaunch, setShowLaunch] = useState(false)
  const [step, setStep] = useState(0)
  const [continents, setContinents] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [interests, setInterests] = useState<Category[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [freeform, setFreeform] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    setShowLaunch(new URLSearchParams(window.location.search).get('restart') === '1')
  }, [])

  const minMet =
    (step === 0 && continents.length >= 1) ||
    (step === 1 && interests.length >= 3) ||
    step === 2

  const finish = useCallback(() => {
    completeOnboarding({
      cities: [...ALL_CITIES],
      interests,
      freeform,
      destinationContinents: continents,
      destinationCountries: countries,
    })
    setGenerating(true)
    setTimeout(() => router.push('/explore'), 1900)
  }, [continents, countries, interests, freeform, completeOnboarding, router])

  const next = () => {
    if (step < 2) setStep((s) => s + 1)
    else finish()
  }

  if (generating) return <GeneratingScreen />
  if (showLaunch) return <LaunchScreen onStart={() => setShowLaunch(false)} />

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
              <StepDestinations
                continents={continents}
                setContinents={setContinents}
                countries={countries}
                setCountries={setCountries}
              />
            )}
            {step === 1 && (
              <StepInterests
                interests={interests}
                setInterests={setInterests}
                searchOpen={searchOpen}
                setSearchOpen={setSearchOpen}
              />
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

function LaunchScreen({ onStart }: { onStart: () => void }) {
  const media = EXPERIENCES.filter((experience) => experience.videoUrl).slice(0, 8)

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-ink text-cream">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="launch-marquee absolute inset-0">
          {[...media, ...media].map((experience, index) => (
            <div
              key={`${experience.id}-${index}`}
              className="absolute w-[31vw] max-w-36 overflow-hidden rounded-2xl border border-cream/15 bg-cream/10 shadow-2xl"
              style={{
                left: `${8 + ((index * 17) % 86)}%`,
                height: `${112 + ((index * 23) % 82)}px`,
                animationDuration: `${25 + ((index * 11) % 24)}s`,
                animationDelay: `${-((index * 7) % 30)}s`,
              }}
            >
              <video
                src={experience.videoUrl ?? undefined}
                poster={experience.posterUrl}
                muted
                autoPlay
                loop
                playsInline
                className="h-full w-full object-cover opacity-70"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/45 via-ink/35 to-ink" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-between px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <span className="font-serif-display text-3xl tracking-tight">Roam</span>
          <span className="text-label text-cream/65">Travel differently</span>
        </div>
        <div className="pb-3">
          <p className="text-label mb-4 text-accent-red">Your next story starts here</p>
          <h1 className="font-serif-display max-w-sm text-5xl leading-[0.96] tracking-tight text-balance">Find the places you&apos;ll want to remember.</h1>
          <p className="text-body mt-5 max-w-xs text-cream/70">A slower way to discover local experiences, shaped around what moves you.</p>
          <button onClick={onStart} className="text-body mt-8 w-full rounded-full bg-cream py-4 font-medium text-ink transition active:scale-[0.98]">Start exploring</button>
        </div>
      </div>
    </main>
  )
}

function StepDestinations({
  continents,
  setContinents,
  countries,
  setCountries,
}: {
  continents: string[]
  setContinents: (c: string[]) => void
  countries: string[]
  setCountries: (c: string[]) => void
}) {
  const toggleContinent = (continent: string) => {
    const next = continents.includes(continent)
      ? continents.filter((item) => item !== continent)
      : [...continents, continent]
    setContinents(next)
    if (continents.includes(continent)) {
      setCountries(countries.filter((country) => !COUNTRIES[continent as keyof typeof COUNTRIES].includes(country)))
    }
  }
  const toggleCountry = (country: string) =>
    setCountries(countries.includes(country) ? countries.filter((item) => item !== country) : [...countries, country])

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-display text-balance">Where are you headed?</h1>
      <p className="text-body text-ink-60 mt-2">Choose a continent, then refine it with countries.</p>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {CONTINENTS.map((continent) => {
          const on = continents.includes(continent)
          return (
            <button
              key={continent}
              onClick={() => toggleContinent(continent)}
              className={cn('relative flex h-28 items-end overflow-hidden rounded-2xl border bg-surface p-3 text-left transition', on ? 'border-accent-red ring-2 ring-accent-red/15' : 'border-line')}
            >
              <img src={CONTINENT_IMAGES[continent]} alt="" className="absolute inset-0 h-full w-full object-contain p-2 opacity-25" />
              <span className="relative z-10 text-label font-medium text-ink">{continent}</span>
              {on && <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-accent-red text-cream"><Check className="size-4" strokeWidth={2.6} aria-hidden /></span>}
            </button>
          )
        })}
      </div>
      {continents.length > 0 && (
        <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
          <p className="text-label mb-2 text-ink-60">Countries</p>
          <div className="no-scrollbar max-h-28 overflow-y-auto space-y-1">
            {continents.flatMap((continent) => COUNTRIES[continent as keyof typeof COUNTRIES]).map((country) => (
              <button key={country} onClick={() => toggleCountry(country)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-ink hover:bg-base">
                {country}
                {countries.includes(country) && <Check className="size-4 text-accent-red" aria-hidden />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StepInterests({
  interests,
  setInterests,
  searchOpen,
  setSearchOpen,
}: {
  interests: Category[]
  setInterests: (c: Category[]) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const toggle = (c: Category) => setInterests(interests.includes(c) ? interests.filter((x) => x !== c) : [...interests, c])
  const searchResults = SEARCH_INTERESTS.filter((interest) => interest.toLowerCase().includes(query.toLowerCase()))
  const pill = (c: Category) => {
    const on = interests.includes(c)
    return (
      <motion.button key={c} onClick={() => toggle(c)} whileTap={{ scale: 1.04 }} className={cn('text-meta flex items-center gap-1.5 rounded-full border px-3 py-2 transition', on ? 'border-ink bg-ink text-cream' : 'border-line bg-surface text-ink')}>
        <CategoryGlyph category={c} className="size-4" />
        {c}
      </motion.button>
    )
  }
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-display text-balance">What are you into?</h1>
      <p className="text-body text-ink-60 mt-2">{interests.length} selected &middot; pick at least 3</p>
      <div className="mt-5 flex flex-wrap gap-2">{CORE_INTERESTS.map(pill)}</div>
      <button onClick={() => setSearchOpen(!searchOpen)} className="text-body mt-4 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-left text-ink">
        <span className="flex items-center gap-2"><Search className="size-4 text-ink-60" aria-hidden /> Search more interests</span>
        <ChevronDown className={cn('size-4 transition-transform', searchOpen && 'rotate-180')} aria-hidden />
      </button>
      {searchOpen && (
        <div className="mt-2 rounded-2xl border border-line bg-surface p-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search interests" className="text-body mb-3 w-full rounded-xl border border-line bg-base px-3 py-2 outline-none focus:border-accent-red" autoFocus />
          <div className="no-scrollbar flex max-h-32 flex-wrap gap-2 overflow-y-auto">{searchResults.map(pill)}</div>
        </div>
      )}
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
