'use client'

import { motion } from 'motion/react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  BadgeCheck,
  Bookmark,
  CalendarDays,
  ChevronLeft,
  Clock,
  MapPin,
  Share2,
  Sparkles,
  Ticket,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { MediaFrame } from '@/components/media-frame'
import { AvatarMono } from '@/components/avatar-mono'
import { CategoryGlyph } from '@/components/category'
import { ScheduleSheet } from '@/components/schedule-sheet'
import { useToast } from '@/components/toast'
import { getExperience } from '@/lib/data'
import { formatDayLong, formatTime } from '@/lib/helpers'
import { useTrip } from '@/lib/trip-context'
import type { City } from '@/lib/types'
import { cn } from '@/lib/utils'

const CITY_JP: Record<City, string> = {
  Tokyo: '\u6771\u4eac',
  Kyoto: '\u4eac\u90fd',
  Osaka: '\u5927\u962a',
}

export default function ExperienceDetail() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const { saved, save, unsave } = useTrip()

  const exp = getExperience(params.id)
  const [muted, setMuted] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  if (!exp) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-void px-8 text-center text-cream">
        <p className="text-title">Experience not found</p>
        <button
          onClick={() => router.push('/explore')}
          className="text-body rounded-full bg-cream px-6 py-3 font-medium text-void"
        >
          Back to Explore
        </button>
      </div>
    )
  }

  const isSaved = saved.includes(exp.id)
  const doShare = () => {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: exp.title, url }).catch(() => {})
    else {
      navigator.clipboard?.writeText(url).catch(() => {})
      toast('Link copied to clipboard')
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-void text-cream lg:mx-auto lg:my-6 lg:min-h-0 lg:w-full lg:max-w-[440px] lg:overflow-hidden lg:rounded-[40px] lg:shadow-2xl">
      <div className="relative pb-28 lg:h-[calc(100dvh-3rem)] lg:overflow-y-auto no-scrollbar">
        {/* Hero */}
        <div className="media-scrim relative h-[55vh] lg:h-[380px]">
          <MediaFrame
            posterUrl={exp.posterUrl}
            videoUrl={exp.videoUrl}
            alt={exp.title}
            active
            muted={muted}
            className="h-full w-full"
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))]">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="glass flex size-10 items-center justify-center rounded-full text-cream"
            >
              <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
            </button>
            <div className="flex gap-2">
              <button
                onClick={doShare}
                aria-label="Share"
                className="glass flex size-10 items-center justify-center rounded-full text-cream"
              >
                <Share2 className="size-[18px]" strokeWidth={1.8} aria-hidden />
              </button>
              {exp.videoUrl && (
                <button
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                  className="glass flex size-10 items-center justify-center rounded-full text-cream"
                >
                  {muted ? (
                    <VolumeX className="size-[18px]" strokeWidth={1.8} aria-hidden />
                  ) : (
                    <Volume2 className="size-[18px]" strokeWidth={1.8} aria-hidden />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pt-5">
          <h1 className="text-display text-balance">{exp.title}</h1>
          <div className="text-meta mt-2 flex flex-wrap items-center gap-2 text-cream-70">
            <span>{exp.neighborhood}</span>
            <span className="size-1 rounded-full bg-cream/40" />
            <span>
              {formatDayLong(exp.date)} &middot; {formatTime(exp.startTime)}
            </span>
          </div>

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-veil py-1.5 pr-3.5 pl-2.5 text-accent-lift">
            <Sparkles className="size-3.5" strokeWidth={2} aria-hidden />
            <span className="text-meta">{exp.matchReason}</span>
          </span>

          {/* Fact tiles */}
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <FactTile icon={CalendarDays} label="Date" value={`Mar ${exp.date.slice(-2)}`} />
            <FactTile icon={Clock} label="Duration" value={`${exp.durationMin} min`} />
            <FactTile icon={Ticket} label="Access" value={exp.ageAccess} />
          </div>

          {/* Description */}
          <div className="mt-6">
            <p className={cn('text-body text-cream/80', !expanded && 'line-clamp-3')}>
              {exp.description}
            </p>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-label mt-2 text-accent-lift"
            >
              {expanded ? 'Read less' : 'Read more'}
            </button>
          </div>

          {/* Location */}
          <div className="mt-6">
            <h2 className="text-label text-cream-55 mb-3">Location</h2>
            <div className="overflow-hidden rounded-[20px] border border-glass-line">
              <div className="relative h-40 overflow-hidden bg-[#e8e4dc]">
                <iframe
                  title={`Map showing ${exp.neighborhood}`}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${exp.lng - 0.025}%2C${exp.lat - 0.018}%2C${exp.lng + 0.025}%2C${exp.lat + 0.018}&layer=mapnik&marker=${exp.lat}%2C${exp.lng}`}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
                <span className="pointer-events-none absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent-red text-cream shadow-lg">
                  <MapPin className="size-5" strokeWidth={2} aria-hidden />
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-body truncate">{exp.neighborhood}</p>
                  <p className="text-meta text-cream-70 truncate">
                    {exp.city} &middot; {CITY_JP[exp.city]}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${exp.lat},${exp.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-label shrink-0 rounded-full bg-cream px-4 py-2 text-void"
                >
                  Get directions
                </a>
              </div>
            </div>
          </div>

          {/* Organizer */}
          <div className="mt-6 flex items-center gap-3">
            <AvatarMono name={exp.host.name} dark className="size-11 text-base" />
            <div>
              <p className="text-label text-cream-55">Hosted by</p>
              <p className="text-body flex items-center gap-1.5">
                {exp.host.name}
                {exp.host.verified && (
                  <BadgeCheck className="size-4 text-accent-lift" strokeWidth={2} aria-hidden />
                )}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {exp.tags.map((t) => (
              <button
                key={t}
                onClick={() => router.push('/explore')}
                className="text-meta flex items-center gap-1.5 rounded-full border border-glass-line px-3.5 py-2 text-cream/80"
              >
                <CategoryGlyph category={t} className="size-3.5" />
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-glass-line bg-void/85 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl lg:absolute">
        <button
          onClick={() => (isSaved ? unsave(exp.id) : save(exp.id))}
          aria-label={isSaved ? 'Remove from saved' : 'Save'}
          aria-pressed={isSaved}
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full border transition active:scale-95',
            isSaved
              ? 'border-accent-red bg-accent-red text-cream'
              : 'border-glass-line text-cream',
          )}
        >
          <motion.span animate={{ scale: isSaved ? [1, 1.2, 1] : 1 }}>
            <Bookmark
              className="size-5"
              strokeWidth={1.9}
              fill={isSaved ? 'currentColor' : 'none'}
              aria-hidden
            />
          </motion.span>
        </button>
        <button
          onClick={() => setScheduleOpen(true)}
          className="text-body flex-1 rounded-full bg-cream py-3.5 font-medium text-void transition active:scale-[0.98]"
        >
          Add to itinerary
        </button>
      </div>

      <ScheduleSheet
        experienceId={scheduleOpen ? exp.id : null}
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
    </div>
  )
}

function FactTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-glass-line bg-glass p-3">
      <Icon className="size-4 text-cream-70" strokeWidth={1.8} aria-hidden />
      <span className="text-label text-cream-55">{label}</span>
      <span className="text-meta text-cream">{value}</span>
    </div>
  )
}
