'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bookmark, Compass, CalendarDays, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/saved', label: 'Saved', Icon: Bookmark },
  { href: '/explore', label: 'Explore', Icon: Compass },
  { href: '/itinerary', label: 'Itinerary', Icon: CalendarDays },
  { href: '/profile', label: 'Profile', Icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center pb-[max(24px,env(safe-area-inset-bottom))]"
      aria-label="Primary"
    >
      <div className="glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className="relative flex h-11 items-center rounded-full px-3.5 outline-none focus-visible:ring-2 focus-visible:ring-cream/40"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-accent-veil"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <Icon
                  className={cn(
                    'size-[22px] transition-colors',
                    active ? 'text-accent-lift' : 'text-cream/55',
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                  aria-hidden
                />
                {active ? (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    className="text-label overflow-hidden whitespace-nowrap text-accent-lift"
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
