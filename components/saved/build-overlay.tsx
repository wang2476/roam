'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useToast } from '@/components/toast'
import { useTrip } from '@/lib/trip-context'

const STEPS = [
  'Grouping by neighborhood\u2026',
  'Balancing your days\u2026',
  'Avoiding conflicts\u2026',
]

export function BuildOverlay({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { buildItinerary } = useTrip()
  const { toast } = useToast()
  const router = useRouter()
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!open) {
      setStep(0)
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStep(1), 700))
    timers.push(setTimeout(() => setStep(2), 1400))
    timers.push(
      setTimeout(() => {
        const { count, days } = buildItinerary()
        onClose()
        router.push('/itinerary')
        toast(`${count} experiences scheduled across ${days} days`, {
          label: 'View',
          href: '/itinerary',
        })
      }, 2200),
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[85] flex flex-col items-center justify-center gap-8 bg-void/92 px-10 text-center backdrop-blur-md"
        >
          <BuildingStack />

          <div className="flex flex-col gap-3">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className="flex items-center gap-3 text-left"
                style={{ opacity: i <= step ? 1 : 0.3 }}
              >
                <span className="flex size-5 items-center justify-center">
                  {i < step ? (
                    <Check className="size-4 text-accent-lift" strokeWidth={2.4} aria-hidden />
                  ) : i === step ? (
                    <motion.span
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="size-2 rounded-full bg-accent-lift"
                    />
                  ) : (
                    <span className="size-2 rounded-full bg-cream/30" />
                  )}
                </span>
                <span className="text-body text-cream">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Mirrors the explore feed's card-stack skeleton so building an itinerary reads
// as a continuation of the same loading language, instead of a generic spinner.
function BuildingStack() {
  return (
    <div className="relative h-36 w-28">
      {[16, 8, 0].map((y, i) => (
        <motion.div
          key={y}
          initial={false}
          animate={{ y: [y, y - 4, y], scale: [1 - i * 0.06, 1 - i * 0.06 + 0.01, 1 - i * 0.06] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
          className="absolute inset-0 overflow-hidden rounded-[20px] border border-glass-line bg-[#1a1714]"
          style={{ opacity: i === 2 ? 1 : 0.55 }}
        >
          {i === 2 && (
            <div className="absolute inset-0 animate-pulse">
              <div className="absolute bottom-3 left-3 right-4 space-y-2">
                <div className="h-3 w-3/4 rounded bg-cream/15" />
                <div className="h-2 w-1/2 rounded bg-cream/15" />
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
