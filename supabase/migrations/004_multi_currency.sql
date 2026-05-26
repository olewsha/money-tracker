-- 004: Multi-currency support — wallets, exchange rates, transfers.
-- Run in Supabase SQL Editor AFTER migration 003.

-- 1. Base currency preference on each user's profile.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS base_currency text NOT NULL DEFAULT 'BYN';

-- 2. Exchange rates cache (NBRB API).
--    `rate` = BYN per 1 unit of foreign currency (normalised from NBRB's Cur_OfficialRate / Cur_Scale).
--    `scale` = original NBRB scale (kept for display: "100 RUB = X BYN").
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  currency_code text           NOT NULL,
  currency_name text,
  rate          numeric(20, 6) NOT NULL,
  scale         integer        NOT NULL DEFAULT 1,
  date          date           NOT NULL,
  fetched_at    timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT exchange_rates_currency_date_key UNIQUE (currency_code, date)
);

CREATE INDEX IF NOT EXISTS exchange_rates_date_idx ON public.exchange_rates (date DESC);
CREATE INDEX IF NOT EXISTS exchange_rates_code_date_idx ON public.exchange_rates (currency_code, date DESC);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users read exchange rates" ON public.exchange_rates;
CREATE POLICY "authenticated users read exchange rates"
  ON public.exchange_rates FOR SELECT TO authenticated USING (true);

-- 3. Wallets / accounts.
CREATE TABLE IF NOT EXISTS public.wallets (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text           NOT NULL,
  type         text           NOT NULL DEFAULT 'card'
               CHECK (type IN ('cash', 'card', 'bank', 'savings', 'other')),
  currency     text           NOT NULL DEFAULT 'BYN',
  balance      numeric(15, 2) NOT NULL DEFAULT 0,
  color        text,
  is_archived  boolean        NOT NULL DEFAULT false,
  created_at   timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON public.wallets (user_id);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users select own wallets" ON public.wallets;
DROP POLICY IF EXISTS "users insert own wallets" ON public.wallets;
DROP POLICY IF EXISTS "users update own wallets" ON public.wallets;
DROP POLICY IF EXISTS "users delete own wallets" ON public.wallets;

CREATE POLICY "users select own wallets"
  ON public.wallets FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = false));

CREATE POLICY "users insert own wallets"
  ON public.wallets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = false));

CREATE POLICY "users update own wallets"
  ON public.wallets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = false))
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = false));

CREATE POLICY "users delete own wallets"
  ON public.wallets FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = false));

-- 4. Transfers between wallets.
CREATE TABLE IF NOT EXISTS public.transfers (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        uuid           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_wallet_id bigint         NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  to_wallet_id   bigint         NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  from_amount    numeric(15, 2) NOT NULL CHECK (from_amount > 0),
  to_amount      numeric(15, 2) NOT NULL CHECK (to_amount > 0),
  from_currency  text           NOT NULL,
  to_currency    text           NOT NULL,
  exchange_rate  numeric(20, 6),
  description    text,
  date           date           NOT NULL DEFAULT CURRENT_DATE,
  created_at     timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT transfers_different_wallets CHECK (from_wallet_id <> to_wallet_id)
);

CREATE INDEX IF NOT EXISTS transfers_user_id_idx ON public.transfers (user_id);
CREATE INDEX IF NOT EXISTS transfers_date_idx    ON public.transfers (date DESC);
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users select own transfers" ON public.transfers;
DROP POLICY IF EXISTS "users insert own transfers" ON public.transfers;
DROP POLICY IF EXISTS "users delete own transfers" ON public.transfers;

CREATE POLICY "users select own transfers"
  ON public.transfers FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = false));

CREATE POLICY "users insert own transfers"
  ON public.transfers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = false));

CREATE POLICY "users delete own transfers"
  ON public.transfers FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_blocked = false));

-- 5. Add wallet reference and native currency to transactions.
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS wallet_id bigint REFERENCES public.wallets(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency  text;

-- 6. Atomic helper: adjust a wallet's balance by a delta (positive or negative).
--    Called from server-side RPC so balance updates are always a single atomic statement.
CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(p_wallet_id bigint, p_delta numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM wallets WHERE id = p_wallet_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Wallet % not found or access denied', p_wallet_id;
  END IF;
  UPDATE wallets SET balance = balance + p_delta WHERE id = p_wallet_id;
END;
$$;

-- 7. Atomic transfer: deduct from source, credit destination, record the transfer row.
CREATE OR REPLACE FUNCTION public.create_transfer_atomic(
  p_from_wallet_id bigint,
  p_to_wallet_id   bigint,
  p_from_amount    numeric,
  p_to_amount      numeric,
  p_from_currency  text,
  p_to_currency    text,
  p_exchange_rate  numeric,
  p_description    text,
  p_date           date
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid         uuid := auth.uid();
  v_transfer_id bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM wallets WHERE id = p_from_wallet_id AND user_id = v_uid) THEN
    RAISE EXCEPTION 'Source wallet not found or access denied';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM wallets WHERE id = p_to_wallet_id AND user_id = v_uid) THEN
    RAISE EXCEPTION 'Target wallet not found or access denied';
  END IF;

  INSERT INTO transfers (
    user_id, from_wallet_id, to_wallet_id,
    from_amount, to_amount, from_currency, to_currency,
    exchange_rate, description, date
  ) VALUES (
    v_uid, p_from_wallet_id, p_to_wallet_id,
    p_from_amount, p_to_amount, p_from_currency, p_to_currency,
    p_exchange_rate, p_description, p_date
  ) RETURNING id INTO v_transfer_id;

  UPDATE wallets SET balance = balance - p_from_amount WHERE id = p_from_wallet_id;
  UPDATE wallets SET balance = balance + p_to_amount   WHERE id = p_to_wallet_id;

  RETURN v_transfer_id;
END;
$$;
