import {
  Briefcase,
  Car,
  Laptop,
  MoreHorizontal,
  Music,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

import { CATEGORIES } from '@/lib/validations'

export type Category = (typeof CATEGORIES)[number]

type CategoryMeta = {
  icon: LucideIcon
  /** Тон точки рядом с категорией. CSS-цвет (oklch) — не из токенов, чтобы каждая
   *  категория имела свой узнаваемый цвет одновременно в светлой и тёмной темах. */
  dotColor: string
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Зарплата: { icon: Briefcase, dotColor: 'oklch(0.65 0.15 160)' },
  Фриланс: { icon: Laptop, dotColor: 'oklch(0.65 0.15 200)' },
  Еда: { icon: UtensilsCrossed, dotColor: 'oklch(0.65 0.15 50)' },
  Транспорт: { icon: Car, dotColor: 'oklch(0.60 0.18 270)' },
  Развлечения: { icon: Music, dotColor: 'oklch(0.65 0.18 320)' },
  Прочее: { icon: MoreHorizontal, dotColor: 'oklch(0.55 0.02 250)' },
}

export function getCategoryMeta(category: string): CategoryMeta {
  if ((CATEGORIES as readonly string[]).includes(category)) {
    return CATEGORY_META[category as Category]
  }
  return CATEGORY_META['Прочее']
}

export { CATEGORIES }
