'use client'

import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
} from 'motion/react'
import { Bookmark, Share2 } from 'lucide-react'
import { MediaFrame } from '@/components/media-frame'
import { MatchChip } from '@/components/match-chip'
import { formatDayShort, formatTime } from '@/lib/helpers'
import type { Experience } from '@/lib/types'

export type Dir = 'left' | 'right' | 'up' | null

export function SwipeCard({
  exp,
  dir,
  onCommit,
  onAdd,
  onOpen,
}: {
  exp: Experience
  dir: Dir
  onCommit: (d: 'left' | 'right') => void
  onAdd: () => void
  onOpen: () => void
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const controls = useAnimationControls()

  const rotate = useTransform(x, [-240, 240], [-12, 12])
  const saveStamp = useTransform(x, [24, 130], [0, 1])
  const passStamp = useTransform(x, [-24, -130], [0, 1])
  const saveWash = useTransform(x, [0, 160], [0, 0.55])
  const passWash = useTransform(x, [-160, 0], [0.55, 0])

  return (
    <motion.div
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      style={{ x, y, rotate }}
      drag
      dragElastic={0.6}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      animate={controls}
      custom={dir}
      variants={{
        exit: (d: Dir) => ({
          x: d === 'left' ? -640 : d === 'right' ? 640 : 0,
          y: d === 'up' ? -760 : 0,
          opacity: 0,
          transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
        }),
      }}
      exit="exit"
      onDragEnd={(_, info) => {
        const el = document.getElementById(`card-${exp.id}`)
        const w = el?.offsetWidth ?? 340
        const thX = 0.35 * w
        if (info.offset.y < -120 && Math.abs(info.offset.x) < 90) {
          controls.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 320, damping: 30 } })
          onAdd()
        } else if (info.offset.x > thX) {
          onCommit('right')
        } else if (info.offset.x < -thX) {
          onCommit('left')
        } else {
          controls.start({
            x: 0,
            y: 0,
            transition: { type: 'spring', stiffness: 320, damping: 26 },
          })
        }
      }}
      onClick={() => {
        if (Math.abs(x.get()) < 6 && Math.abs(y.get()) < 6) onOpen()
      }}
      id={`card-${exp.id}`}
    >
      <div className="media-scrim relative h-full w-full overflow-hidden rounded-[28px]">
        <MediaFrame
          posterUrl={exp.posterUrl}
          videoUrl={exp.videoUrl}
          alt={`${exp.title}, ${exp.neighborhood}`}
          active
          className="h-full w-full"
        />

        {/* color washes */}
        <motion.div
          style={{ opacity: saveWash }}
          className="pointer-events-none absolute inset-0 bg-accent-red mix-blend-multiply"
        />
        <motion.div
          style={{ opacity: passWash }}
          className="pointer-events-none absolute inset-0 bg-void/70"
        />

        {/* stamps */}
        <motion.div
          style={{ opacity: saveStamp }}
          className="pointer-events-none absolute left-6 top-8 -rotate-12 rounded-xl border-[3px] border-accent-lift px-4 py-1"
        >
          <span className="text-2xl font-semibold tracking-widest text-accent-lift">
            SAVE
          </span>
        </motion.div>
        <motion.div
          style={{ opacity: passStamp }}
          className="pointer-events-none absolute right-6 top-8 rotate-12 rounded-xl border-[3px] border-cream/50 px-4 py-1"
        >
          <span className="text-2xl font-semibold tracking-widest text-cream/50">
            PASS
          </span>
        </motion.div>

        {/* content */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-6">
          <MatchChip reason={exp.matchReason} className="w-fit" />
          <h2 className="font-serif-display text-display line-clamp-2 text-cream text-balance">
            {exp.title}
          </h2>
          <div className="text-meta flex items-center gap-2 text-cream-70">
            <span>{exp.neighborhood}</span>
            <span className="size-1 rounded-full bg-cream/40" />
            <span>
              {formatDayShort(exp.date)} · {formatTime(exp.startTime)}
            </span>
          </div>
          <p className="text-body line-clamp-2 text-cream/70">
            {exp.description}
          </p>
          <div className="text-meta mt-1 flex items-center gap-5 text-cream-70">
            <span className="flex items-center gap-1.5">
              <Bookmark className="size-4" strokeWidth={1.8} />
              {exp.saveCount.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5">
              <Share2 className="size-4" strokeWidth={1.8} />
              {exp.shareCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
