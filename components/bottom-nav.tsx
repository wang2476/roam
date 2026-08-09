'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bookmark, Compass, CalendarDays, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/explore', label: 'Explore', Icon: Compass },
  { href: '/itinerary', label: 'Itinerary', Icon: CalendarDays },
  { href: '/saved', label: 'Saved', Icon: Bookmark },
  { href: '/profile', label: 'Profile', Icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center pb-[max(24px,env(safe-area-inset-bottom))]"
      aria-label="Primary"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-line bg-surface/95 p-1.5 shadow-[0_8px_30px_rgba(20,18,16,0.12)] backdrop-blur-xl">
        {ITEMS.map(({ href, label, Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className="relative flex h-11 items-center rounded-xl px-3.5 outline-none focus-visible:ring-2 focus-visible:ring-accent-red/30"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-accent-tint"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <Icon
                  className={cn(
                    'size-[22px] transition-colors',
                    active ? 'text-accent-red' : 'text-ink-30',
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                  aria-hidden
                />
                {active ? (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    className="text-label overflow-hidden whitespace-nowrap text-accent-red"
                  >
                    {label}
                  </motion.span>
                ) : (
                  <span className="sr-only">{label}</span>
                )}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
