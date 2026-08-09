import { cn } from '@/lib/utils'

export function AvatarMono({
  name,
  className,
  dark,
}: {
  name: string
  className?: string
  dark?: boolean
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium select-none',
        dark
          ? 'bg-glass text-cream border border-glass-line'
          : 'bg-secondary text-ink',
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}
