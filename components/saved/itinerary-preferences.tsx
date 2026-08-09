'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Mic, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Budget = 'budget' | 'mid' | 'splurge'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DEMO_START = new Date(2026, 7, 14)
const DEMO_END = new Date(2026, 7, 21)

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}
function displayDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function daysBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
}

export function ItineraryPreferences({ open, onClose, onBuild }: { open: boolean; onClose: () => void; onBuild: () => void }) {
  const [step, setStep] = useState(0)
  const [month, setMonth] = useState(new Date(2026, 7, 1))
  const [start, setStart] = useState(DEMO_START)
  const [end, setEnd] = useState(DEMO_END)
  const [flexible, setFlexible] = useState(true)
  const [people, setPeople] = useState(2)
  const [budget, setBudget] = useState<Budget>('mid')
  const [freeOnly, setFreeOnly] = useState(false)
  const [notes, setNotes] = useState('')

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
  }, [month])

  const selectDate = (date: Date) => {
    if (!start || (start && end)) {
      setStart(date)
      setEnd(date)
      setFlexible(false)
    } else if (date < start) {
      setStart(date)
      setEnd(start)
    } else {
      setEnd(date)
    }
  }

  const next = () => step === 3 ? onBuild() : setStep((value) => value + 1)
  const back = () => step === 0 ? onClose() : setStep((value) => value - 1)

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[80] flex flex-col bg-base">
          <header className="flex items-center justify-between px-5 pb-3 pt-[max(18px,env(safe-area-inset-top))]">
            <button onClick={back} aria-label="Go back" className="flex size-10 items-center justify-center rounded-full bg-surface"><ChevronLeft className="size-5" /></button>
            <div className="flex gap-1.5" aria-label={`Step ${step + 1} of 4`}>{[0, 1, 2, 3].map((item) => <span key={item} className={cn('h-1 w-8 rounded-full', item <= step ? 'bg-accent-red' : 'bg-line')} />)}</div>
            <button onClick={onClose} className="text-meta text-ink-60">Close</button>
          </header>

          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-28">
            {step === 0 && <DatesStep month={month} setMonth={setMonth} start={start} end={end} flexible={flexible} setFlexible={setFlexible} days={calendarDays} onSelect={selectDate} />}
            {step === 1 && <PeopleStep people={people} setPeople={setPeople} />}
            {step === 2 && <BudgetStep budget={budget} setBudget={setBudget} freeOnly={freeOnly} setFreeOnly={setFreeOnly} />}
            {step === 3 && <NotesStep notes={notes} setNotes={setNotes} />}
          </main>

          <footer className="absolute inset-x-0 bottom-0 border-t border-line bg-base/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <button onClick={next} className="w-full rounded-full bg-ink py-3.5 text-title text-cream">{step === 3 ? 'Build my itinerary' : 'Continue'}</button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DatesStep({ month, setMonth, start, end, flexible, setFlexible, days, onSelect }: any) {
  return <section className="pt-8">
    <p className="text-label uppercase tracking-[0.16em] text-accent-red">Step 1 · Travel dates</p>
    <h2 className="mt-2 font-serif-display text-4xl leading-tight">When are you going?</h2>
    <p className="text-body mt-2 text-ink-60">Pick a window and we&apos;ll shape the saved places around it.</p>
    <div className="mt-6 rounded-[24px] bg-surface p-4">
      <div className="mb-4 flex items-center justify-between"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft className="size-5" /></button><p className="text-title">{MONTHS[month.getMonth()]} {month.getFullYear()}</p><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight className="size-5" /></button></div>
      <div className="grid grid-cols-7 gap-1 text-center">{WEEKDAYS.map((day) => <span key={day} className="text-label py-1 text-ink-40">{day}</span>)}{days.map((date: Date | null, index: number) => date ? <button key={dateKey(date)} onClick={() => onSelect(date)} className={cn('relative flex aspect-square items-center justify-center rounded-full text-meta', date >= start && date <= end && 'bg-accent-red/15', dateKey(date) === dateKey(start) || dateKey(date) === dateKey(end) ? 'bg-accent-red font-medium text-cream' : 'text-ink')}>{date.getDate()}</button> : <span key={`empty-${index}`} />)}</div>
    </div>
    <p className="mt-4 flex items-center gap-2 text-title"><CalendarDays className="size-4 text-accent-red" />{displayDate(start)} – {displayDate(end)} · {daysBetween(start, end)} days</p>
    <label className="mt-5 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5"><span><span className="text-title block">Flexible dates</span><span className="text-meta text-ink-60">We&apos;ll use this window for the demo</span></span><input type="checkbox" checked={flexible} onChange={(event) => setFlexible(event.target.checked)} className="size-5 accent-accent-red" /></label>
  </section>
}

function PeopleStep({ people, setPeople }: { people: number; setPeople: (value: number) => void }) {
  return <section className="pt-8"><p className="text-label uppercase tracking-[0.16em] text-accent-red">Step 2 · Travelers</p><h2 className="mt-2 font-serif-display text-4xl leading-tight">Who&apos;s coming?</h2><p className="text-body mt-2 text-ink-60">We&apos;ll keep the rhythm comfortable for your group.</p><div className="mt-10 flex items-center justify-between rounded-[24px] bg-surface p-5"><div><p className="text-title">People</p><p className="text-meta text-ink-60">Including you</p></div><div className="flex items-center gap-4"><button onClick={() => setPeople(Math.max(1, people - 1))} className="flex size-10 items-center justify-center rounded-full border border-line" aria-label="Remove person"><Minus className="size-4" /></button><span className="w-6 text-center font-serif-display text-3xl">{people}</span><button onClick={() => setPeople(Math.min(12, people + 1))} className="flex size-10 items-center justify-center rounded-full bg-ink text-cream" aria-label="Add person"><Plus className="size-4" /></button></div></div></section>
}

function BudgetStep({ budget, setBudget, freeOnly, setFreeOnly }: { budget: Budget; setBudget: (value: Budget) => void; freeOnly: boolean; setFreeOnly: (value: boolean) => void }) {
  const tiers = [{ id: 'budget' as const, name: 'Budget', range: 'under ¥3,000' }, { id: 'mid' as const, name: 'Mid', range: '¥3,000–10,000' }, { id: 'splurge' as const, name: 'Splurge', range: '¥10,000+' }]
  return <section className="pt-8"><p className="text-label uppercase tracking-[0.16em] text-accent-red">Step 3 · Budget</p><h2 className="mt-2 font-serif-display text-4xl leading-tight">What feels right?</h2><p className="text-body mt-2 text-ink-60">Choose the pace and price point for your saved places.</p><div className="mt-7 flex flex-col gap-3">{tiers.map((tier) => <button key={tier.id} onClick={() => setBudget(tier.id)} className={cn('rounded-[22px] border p-4 text-left transition', budget === tier.id ? 'border-accent-red bg-accent-red/8' : 'border-line bg-surface')}><span className="text-title block">{tier.name}</span><span className="text-meta text-ink-60">{tier.range}</span></button>)}</div><label className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5"><span className="text-title">Free experiences only</span><input type="checkbox" checked={freeOnly} onChange={(event) => setFreeOnly(event.target.checked)} className="size-5 accent-accent-red" /></label></section>
}

function NotesStep({ notes, setNotes }: { notes: string; setNotes: (value: string) => void }) {
  return <section className="pt-8"><p className="text-label uppercase tracking-[0.16em] text-accent-red">Step 4 · Tell us more</p><h2 className="mt-2 font-serif-display text-4xl leading-tight">Make it feel like you.</h2><p className="text-body mt-2 text-ink-60">A few words help us tune the rhythm of your itinerary.</p><div className="relative mt-7"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="I love tiny jazz bars and vintage shops, and I'd rather avoid crowds…" className="min-h-48 w-full resize-none rounded-[24px] border border-line bg-surface p-4 pr-16 text-body text-ink outline-none placeholder:text-ink-40 focus:border-accent-red" /><button type="button" aria-label="Record a voice note" className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full bg-accent-red text-cream"><Mic className="size-5" /></button></div></section>
}
