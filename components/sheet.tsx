'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export function BottomSheet({
  open,
  onClose,
  children,
  theme = 'light',
  labelledBy,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  theme?: 'light' | 'dark'
  labelledBy?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[75] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose()
            }}
            className={cn(
              'relative w-full max-w-[440px] rounded-t-[28px] px-5 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]',
              theme === 'dark'
                ? 'bg-[#1a1714] text-cream'
                : 'bg-surface text-ink',
            )}
          >
            <div
              className={cn(
                'mx-auto mb-4 h-1 w-10 rounded-full',
                theme === 'dark' ? 'bg-cream/25' : 'bg-line',
              )}
            />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
