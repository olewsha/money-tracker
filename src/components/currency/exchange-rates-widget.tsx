import { RefreshCw } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import type { ExchangeRate } from '@/lib/types'

const DISPLAY_CURRENCIES = ['USD', 'EUR', 'RUB', 'GEL', 'CNY', 'UAH', 'PLN', 'GBP']

type Props = {
  rates: ExchangeRate[]
  className?: string
}

export function ExchangeRatesWidget({ rates, className }: Props) {
  const latestDate = rates[0]?.date

  const displayRates = DISPLAY_CURRENCIES.flatMap((code) => {
    const r = rates.find((x) => x.currency_code === code)
    return r ? [r] : []
  })

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Курсы НБ РБ
          </CardTitle>
          {latestDate && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <RefreshCw className="size-3" />
              {formatDate(latestDate)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {displayRates.length === 0 ? (
          <p className="text-xs text-muted-foreground">Курсы не загружены</p>
        ) : (
          <ul className="space-y-2">
            {displayRates.map((r) => {
              const displayRate = r.scale > 1
                ? (Number(r.rate) * r.scale).toFixed(4)
                : Number(r.rate).toFixed(4)
              const unitLabel = r.scale > 1 ? `${r.scale} ` : '1 '
              return (
                <li key={r.currency_code} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{r.currency_code}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {unitLabel}= {displayRate} BYN
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
