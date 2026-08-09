import {
  Camera,
  Coffee,
  Drama,
  Gamepad2,
  Landmark,
  Map,
  Moon,
  Mountain,
  Palette,
  Shirt,
  Sprout,
  TentTree,
  Theater,
  Trophy,
  Waves,
  Wheat,
  Music,
  PartyPopper,
  ShoppingBag,
  Utensils,
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
  Photography: Camera,
  Architecture: Map,
  History: Landmark,
  Beaches: Waves,
  Hiking: Mountain,
  Coffee: Coffee,
  Design: Palette,
  Fashion: Shirt,
  'Wellness Retreats': TentTree,
  'Local Markets': ShoppingBag,
  'Language Exchange': Wheat,
  Film: Theater,
  Sports: Trophy,
  Wildlife: Sprout,
  Sustainability: Sprout,
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
