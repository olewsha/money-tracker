import 'server-only'

import type Stripe from 'stripe'

import { createAdminClient } from '@/lib/supabase/admin'

export type WebhookLogStatus = 'received' | 'processed' | 'skipped' | 'failed'

interface RecordedEvent {
  id: number
  status: WebhookLogStatus
  attempts: number
}

/**
 * Records a freshly-received Stripe event in `stripe_webhook_events`.
 *
 * Returns:
 *   - `{ alreadyProcessed: true }`  — Stripe is retrying an event we already
 *     finished. Caller should ack with 200 and skip the handler.
 *   - `{ alreadyProcessed: false, log }` — fresh row (or a previously-failed
 *     row whose attempts counter has been bumped). Caller should run the
 *     handler and then call `markEventProcessed`/`markEventFailed`.
 */
export async function recordEventReceived(
  event: Stripe.Event,
  context: { customerId?: string | null; userId?: string | null }
): Promise<
  | { alreadyProcessed: true; log: RecordedEvent }
  | { alreadyProcessed: false; log: RecordedEvent }
> {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('stripe_webhook_events')
    .select('id, status, attempts')
    .eq('stripe_event_id', event.id)
    .maybeSingle<RecordedEvent>()

  if (existing) {
    if (existing.status === 'processed' || existing.status === 'skipped') {
      return { alreadyProcessed: true, log: existing }
    }
    // Stripe is retrying a previously-failed event. Bump attempts and let the
    // handler try again.
    const { data: bumped } = await admin
      .from('stripe_webhook_events')
      .update({
        status: 'received',
        attempts: existing.attempts + 1,
        error_message: null,
        error_stack: null,
      })
      .eq('id', existing.id)
      .select('id, status, attempts')
      .single<RecordedEvent>()

    return { alreadyProcessed: false, log: bumped ?? existing }
  }

  const { data, error } = await admin
    .from('stripe_webhook_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      status: 'received' satisfies WebhookLogStatus,
      payload: event as unknown as Record<string, unknown>,
      stripe_customer_id: context.customerId ?? null,
      user_id: context.userId ?? null,
      attempts: 1,
    })
    .select('id, status, attempts')
    .single<RecordedEvent>()

  if (error || !data) {
    // We can't persist — fall back to a synthetic log so the handler still
    // runs. The next step will fail to update too, but the handler itself
    // shouldn't be blocked by an observability outage.
    console.error('[stripe webhook] failed to insert event log:', error)
    return {
      alreadyProcessed: false,
      log: { id: -1, status: 'received', attempts: 1 },
    }
  }

  return { alreadyProcessed: false, log: data }
}

export async function markEventProcessed(
  logId: number,
  patch: { userId?: string | null; status?: 'processed' | 'skipped' } = {}
): Promise<void> {
  if (logId < 0) return

  const admin = createAdminClient()
  await admin
    .from('stripe_webhook_events')
    .update({
      status: patch.status ?? 'processed',
      processed_at: new Date().toISOString(),
      ...(patch.userId !== undefined ? { user_id: patch.userId } : {}),
    })
    .eq('id', logId)
}

export async function markEventFailed(
  logId: number,
  err: unknown
): Promise<void> {
  if (logId < 0) return

  const admin = createAdminClient()
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack ?? null : null

  // Hard cap to keep payloads small and avoid PII spillover from upstream.
  const safeMessage = message.slice(0, 2000)
  const safeStack = stack ? stack.slice(0, 8000) : null

  await admin
    .from('stripe_webhook_events')
    .update({
      status: 'failed',
      processed_at: new Date().toISOString(),
      error_message: safeMessage,
      error_stack: safeStack,
    })
    .eq('id', logId)
}
