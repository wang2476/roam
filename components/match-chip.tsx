import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MatchChip({
  reason,
  variant = 'dark',
  className,
}: {
  reason: string
  variant?: 'dark' | 'light'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full py-1 pr-3 pl-2',
        variant === 'dark'
          ? 'bg-accent-veil text-accent-lift'
          : 'bg-accent-tint text-accent-red',
        className,
      )}
    >
      <Sparkles className="size-3 shrink-0" strokeWidth={2} aria-hidden />
      <span className="text-label truncate normal-case tracking-normal">
        {reason}
      </span>
    </span>
  )
}
