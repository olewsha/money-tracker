import { getCategoryMeta } from '@/lib/categories'
import { cn } from '@/lib/utils'

type Props = {
  category: string
  className?: string
  showIcon?: boolean
}

export function CategoryBadge({ category, className, showIcon = true }: Props) {
  const meta = getCategoryMeta(category)
  const Icon = meta.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground',
        className
      )}
    >
      {showIcon ? (
        <Icon className="size-3.5 text-muted-foreground" />
      ) : (
        <span
          aria-hidden
          className="inline-block size-1.5 rounded-full"
          style={{ backgroundColor: meta.dotColor }}
        />
      )}
      <span>{category}</span>
    </span>
  )
}
