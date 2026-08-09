import {
  Drama,
  Gamepad2,
  Landmark,
  Moon,
  Mountain,
  Music,
  PartyPopper,
  ShoppingBag,
  Utensils,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import type { Category } from '@/lib/types'

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  Food: Utensils,
  Nightlife: Moon,
  Art: Drama,
  Anime: Gamepad2,
  Music: Music,
  Nature: Mountain,
  Shopping: ShoppingBag,
  Festivals: PartyPopper,
  Wellness: Waves,
  Traditional: Landmark,
}

export function CategoryGlyph({
  category,
  className,
}: {
  category: Category
  className?: string
}) {
  const Icon = CATEGORY_ICON[category]
  return <Icon className={className} strokeWidth={1.6} aria-hidden />
}
