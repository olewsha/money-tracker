'use client'

import { MoreHorizontal, Shield, ShieldOff, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type Props = {
  disabled: boolean
  disabledReason?: string
  isBlocked: boolean
  onBlock: () => void
  onDelete: () => void
}

export function UserActionsMenu({
  disabled,
  disabledReason,
  isBlocked,
  onBlock,
  onDelete,
}: Props) {
  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Действия недоступны"
              disabled
            />
          }
        >
          <MoreHorizontal />
        </TooltipTrigger>
        <TooltipContent>
          {disabledReason ?? 'Действия недоступны'}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Действия"
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4}>
        <DropdownMenuItem onClick={onBlock}>
          {isBlocked ? (
            <>
              <ShieldOff className="text-muted-foreground" />
              Разблокировать
            </>
          ) : (
            <>
              <Shield className="text-muted-foreground" />
              Заблокировать
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 />
          Удалить навсегда
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
