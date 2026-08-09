'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { BottomSheet } from './sheet'
import { MediaFrame } from './media-frame'
import { useToast } from './toast'
import { TRIP_DAYS, getExperience } from '@/lib/data'
import { formatDayLong, formatTime, timeToMinutes } from '@/lib/helpers'
import { useTrip } from '@/lib/trip-context'
import { dayName, dayNum } from '@/lib/helpers'

export function ScheduleSheet({
  experienceId,
  open,
  onClose,
}: {
  experienceId: string | null
  open: boolean
  onClose: () => void
}) {
  const { scheduled, schedule } = useTrip()
  const { toast } = useToast()
  const exp = experienceId ? getExperience(experienceId) : null

  const [day, setDay] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [note, setNote] = useState('')
  const timeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (exp && open) {
      setDay(exp.date)
      setTime(exp.startTime)
      setNote('')
    }
  }, [exp, open])

  const conflict = useMemo(() => {
    if (!exp || !day || !time) return null
    const start = timeToMinutes(time)
    const end = start + exp.durationMin
    for (const it of scheduled) {
      if (it.day !== day) continue
      const other = getExperience(it.experienceId)
      if (!other) continue
      const oStart = timeToMinutes(it.time)
      const oEnd = oStart + other.durationMin
      if (start < oEnd && end > oStart) return { other, oStart }
    }
    return null
  }, [exp, day, time, scheduled])

  if (!exp) return null

  const dayIndex = TRIP_DAYS.indexOf(day) + 1

  function confirm() {
    if (!exp) return
    schedule({ experienceId: exp.id, day, time, note: note.trim() || undefined })
    onClose()
    toast(`Added to ${formatDayLong(day)}`, {
      label: 'View itinerary',
      href: '/itinerary',
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="schedule-title">
      <div className="flex items-center gap-3">
        <MediaFrame
          posterUrl={exp.posterUrl}
          videoUrl={null}
          alt={exp.title}
          active={false}
          className="size-14 shrink-0 rounded-2xl"
        />
        <div className="min-w-0">
          <p className="text-label text-ink-30">Add to itinerary</p>
          <h2 id="schedule-title" className="text-body truncate font-medium">
            {exp.title}
          </h2>
        </div>
      </div>

      <p className="text-label text-ink-30 mt-6 mb-2">Choose a day</p>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {TRIP_DAYS.map((d) => {
          const selected = d === day
          const isEventDate = d === exp.date
          return (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`flex shrink-0 flex-col items-center rounded-2xl border px-3.5 py-2 transition ${
                selected
                  ? 'border-accent-red bg-accent-tint text-accent-red'
                  : 'border-line bg-surface text-ink'
              }`}
            >
              <span className="text-label tracking-normal normal-case">
                {dayName(d)}
              </span>
              <span className="text-body font-medium leading-tight">
                {dayNum(d)}
              </span>
              {isEventDate && (
                <span className="text-[9px] font-semibold uppercase tracking-wider text-accent-red">
                  Event date
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-5 flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="sched-time" className="text-label text-ink-30 mb-2 block">
            Start time
          </label>
          <input
            id="sched-time"
            ref={timeRef}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="text-body w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent-red"
          />
        </div>
        <div className="pb-3 text-right">
          <p className="text-label text-ink-30 tracking-normal normal-case">
            Ends
          </p>
          <p className="text-body font-medium">
            {formatTime(
              `${Math.floor((timeToMinutes(time || exp.startTime) + exp.durationMin) / 60) % 24}:${String(
                (timeToMinutes(time || exp.startTime) + exp.durationMin) % 60,
              ).padStart(2, '0')}`,
            )}
          </p>
        </div>
      </div>

      {conflict && (
        <div className="mt-4 rounded-2xl bg-warn-tint p-3">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" strokeWidth={2} />
            <p className="text-meta text-ink">
              Overlaps with {conflict.other.title} (
              {formatTime(
                `${Math.floor(conflict.oStart / 60)}:${String(conflict.oStart % 60).padStart(2, '0')}`,
              )}
              )
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={confirm}
              className="text-label flex-1 rounded-full bg-warn py-2.5 text-white transition active:scale-95"
            >
              Schedule anyway
            </button>
            <button
              onClick={() => {
                timeRef.current?.focus()
                timeRef.current?.showPicker?.()
              }}
              className="text-label flex-1 rounded-full border border-line py-2.5 text-ink transition active:scale-95"
            >
              Pick another time
            </button>
          </div>
        </div>
      )}

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        className="text-body mt-4 w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none placeholder:text-ink-30 focus:border-accent-red"
      />

      {!conflict && (
        <button
          onClick={confirm}
          className="text-body mt-5 w-full rounded-full bg-ink py-3.5 font-medium text-cream transition active:scale-[0.98]"
        >
          Add to Day {dayIndex}
        </button>
      )}
    </BottomSheet>
  )
}
