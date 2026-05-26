-- 005: Subscription plans (free / pro) and Stripe billing fields.
-- Run in Supabase SQL Editor AFTER migration 004.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_plan_idx ON public.profiles (plan);
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_idx ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Admins always have pro-level access in application code (role = 'admin').
