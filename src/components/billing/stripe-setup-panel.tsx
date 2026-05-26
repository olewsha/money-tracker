import Link from 'next/link'
import { AlertCircle, ExternalLink } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { StripeSetupStatus } from '@/lib/stripe-keys'

const DOCS_KEYS = 'https://docs.stripe.com/keys'
const DASHBOARD_TEST_KEYS = 'https://dashboard.stripe.com/test/apikeys'
const DASHBOARD_WEBHOOKS = 'https://dashboard.stripe.com/test/webhooks'

type Props = {
  status: StripeSetupStatus
}

export function StripeSetupPanel({ status }: Props) {
  if (status.configured) {
    if (status.warnings.length === 0) return null
    return (
      <Alert className="mb-6 border-amber-500/30 bg-amber-500/5">
        <AlertCircle className="text-amber-600" />
        <AlertTitle>Рекомендации по ключам Stripe</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
            {status.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="mb-6" variant="destructive">
      <AlertCircle />
      <AlertTitle>Stripe не настроен</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm">
          Добавьте ключи в <code className="rounded bg-muted px-1">.env.local</code> по{' '}
          <Link
            href={DOCS_KEYS}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 underline"
          >
            документации Stripe
            <ExternalLink className="size-3" />
          </Link>
          . Для разработки используйте <strong>sandbox (test)</strong> ключи.
        </p>
        <ol className="list-inside list-decimal space-y-1 text-sm">
          <li>
            <Link href={DASHBOARD_TEST_KEYS} target="_blank" rel="noopener noreferrer" className="underline">
              Developers → API keys (test mode)
            </Link>
            : скопируйте Secret key (<code>sk_test_</code>) или Restricted key (<code>rk_test_</code>) →{' '}
            <code>STRIPE_SECRET_KEY</code>
          </li>
          <li>
            Опционально Publishable key (<code>pk_test_</code>) →{' '}
            <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
          </li>
          <li>
            Products → создайте цены Pro → <code>STRIPE_PRICE_PRO_MONTHLY</code> /{' '}
            <code>STRIPE_PRICE_PRO_YEARLY</code> (<code>price_...</code>)
          </li>
          <li>
            <Link href={DASHBOARD_WEBHOOKS} target="_blank" rel="noopener noreferrer" className="underline">
              Webhooks
            </Link>
            : endpoint <code>/api/stripe/webhook</code>, signing secret → <code>STRIPE_WEBHOOK_SECRET</code> (
            <code>whsec_</code>)
          </li>
          <li>
            Локально: <code>stripe listen --forward-to localhost:3000/api/stripe/webhook</code>
          </li>
        </ol>
        <p className="text-sm font-medium">Не хватает:</p>
        <ul className="list-inside list-disc text-sm">
          {status.missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
