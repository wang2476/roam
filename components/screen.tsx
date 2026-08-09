'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { BottomNav } from './bottom-nav'

/**
 * Centered phone column. Below 1024px it fills the viewport; above it centers
 * a 440px column with a soft shadow over an ambient background layer.
 */
export function Screen({
  bg,
  ambientImage,
  showNav = false,
  children,
  className,
}: {
  bg: 'void' | 'base'
  ambientImage?: string
  showNav?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-[100dvh] w-full justify-center',
        bg === 'void' ? 'bg-void' : 'bg-[#efeae2]',
      )}
    >
      {/* desktop ambient background */}
      <div
        aria-hidden
        className="fixed inset-0 hidden bg-void lg:block"
      >
        {ambientImage && (
          <motion.img
            key={ambientImage}
            src={ambientImage}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            transition={{ duration: 0.6 }}
            className="h-full w-full scale-110 object-cover blur-[60px]"
          />
        )}
        <div className="absolute inset-0 bg-void/55" />
      </div>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.24 }}
        className={cn(
          'relative w-full max-w-[440px] overflow-hidden',
          bg === 'void' ? 'bg-void text-cream' : 'bg-base text-ink',
          'lg:my-6 lg:min-h-0 lg:rounded-[40px] lg:shadow-2xl lg:shadow-black/40',
          'min-h-[100dvh] lg:h-[calc(100dvh-3rem)]',
          className,
        )}
      >
        <div className="relative flex h-full min-h-[100dvh] flex-col lg:min-h-0 lg:h-[calc(100dvh-3rem)] lg:overflow-y-auto no-scrollbar">
          {children}
        </div>
        {showNav && <BottomNav />}
      </motion.main>
    </div>
  )
}
