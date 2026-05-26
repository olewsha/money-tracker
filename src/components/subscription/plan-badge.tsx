import { Crown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UserPlan } from '@/lib/types'

type Props = {
  plan: UserPlan
  className?: string
}

export function PlanBadge({ plan, className }: Props) {
  if (plan === 'pro') {
    return (
      <Badge
        className={cn(
          'gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
          className
        )}
      >
        <Crown className="size-3" />
        Pro
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className={className}>
      Free
    </Badge>
  )
}
