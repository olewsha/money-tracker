import Link from 'next/link'
import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type Props = {
  title: string
  description: string
  href?: string
}

export function UpgradeBanner({
  title,
  description,
  href = '/billing',
}: Props) {
  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Sparkles className="text-primary" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{description}</span>
        <Button size="sm" nativeButton={false} render={<Link href={href} />}>
          Перейти на Pro
        </Button>
      </AlertDescription>
    </Alert>
  )
}
